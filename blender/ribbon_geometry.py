"""Continuous, arc-length-driven ribbon surfaces, evaluated at every subframe.

The node modifier samples paired rails instead of blending baked deformation
poses. Completed geometry stays fixed while the free end travels along the form.
"""
from bisect import bisect_left
import math
import bpy
from mathutils import Vector


def smooth_handles(points):
    points = [Vector(p) for p in points]
    # Align the tangents at each join; preserve anchors and limit overshoot.
    for k in range(3, len(points)-1, 3):
        incoming, outgoing = points[k]-points[k-1], points[k+1]-points[k]
        direction = incoming.normalized()+outgoing.normalized()
        if direction.length < .01:
            continue
        direction.normalize()
        length = min(incoming.length, outgoing.length)
        points[k-1] = points[k]-direction*length
        points[k+1] = points[k]+direction*length
    return points


def bezier(points, t):
    n = (len(points)-1)//3
    scaled = min(t, 1-1e-10)*n
    i, u = int(scaled)*3, scaled % 1
    return ((1-u)**3*points[i]+3*(1-u)**2*u*points[i+1]
            +3*(1-u)*u*u*points[i+2]+u**3*points[i+3])


def paired_rails(a, b, reverse, count=1025):
    a, b = smooth_handles(a), smooth_handles(b)
    def world(p):
        return Vector(((p.x-525)/245, p.z*1.65, (780-p.y)/245))
    dense = []
    distance = [0]
    last = None
    for i in range(4097):
        t = 1-i/4096 if reverse else i/4096
        left, right = world(bezier(a,t)), world(bezier(b,t))
        center = (left+right)*.5
        dense.append((left,right))
        if last is not None:
            distance.append(distance[-1]+(center-last).length)
        last = center
    rails=[]
    for i in range(count):
        target = distance[-1]*i/(count-1)
        k = max(1, min(bisect_left(distance,target),len(distance)-1))
        mix = (target-distance[k-1])/max(distance[k]-distance[k-1],1e-9)
        rails.append(tuple(dense[k-1][side].lerp(dense[k][side],mix) for side in [0,1]))
    return rails


def ribbon(name, a, b, front, reverse_mat, edge, root, start, finish,
           reverse=False, bulge=.045, flip=False):
    scene=bpy.context.scene
    rails=paired_rails(a,b,reverse)
    data=bpy.data.meshes.new(name+' / rail table')
    data.from_pydata([(i/(len(rails)-1),0,0) for i in range(len(rails))],[],[])
    for label, side in [('Left',0),('Right',1)]:
        attr=data.attributes.new(label,'FLOAT_VECTOR','POINT')
        attr.data.foreach_set('vector',[v for pair in rails for v in pair[side]])
    lookup=bpy.data.objects.new(name+' / editable rail samples',data)
    scene.collection.objects.link(lookup)
    lookup.hide_render=True
    lookup.hide_set(True)

    rows, cols = 240, 10
    grid=bpy.data.meshes.new(name)
    verts=[(i/rows,j/cols,0) for i in range(rows+1) for j in range(cols+1)]
    faces=[]
    for i in range(rows):
        for j in range(cols):
            n=i*(cols+1)+j
            face=(n,n+cols+1,n+cols+2,n+1)
            faces.append(tuple(reversed(face)) if flip else face)
    grid.from_pydata(verts,[],faces)
    grid.update()
    uv=grid.uv_layers.new(name='Along the ribbon')
    for polygon in grid.polygons:
        polygon.use_smooth=True
        for index in polygon.loop_indices:
            v=grid.loops[index].vertex_index
            uv.data[index].uv=(v//(cols+1)/rows,v%(cols+1)/cols)
    ob=bpy.data.objects.new(name,grid)
    scene.collection.objects.link(ob)
    ob.parent=root
    for mat in [front,reverse_mat,edge]:
        grid.materials.append(mat)

    tree=bpy.data.node_groups.new(name+' / continuous unfurl','GeometryNodeTree')
    tree.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry')
    progress=tree.interface.new_socket(name='Progress',in_out='INPUT',socket_type='NodeSocketFloat')
    progress.min_value=0
    progress.max_value=1
    tree.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
    nodes,links=tree.nodes,tree.links
    def node(kind,label):
        obj=nodes.new(kind)
        obj.label=label
        return obj
    def connect(value,socket):
        if isinstance(value,bpy.types.NodeSocket):
            links.new(value,socket)
        else:
            socket.default_value=value
    def math_node(op,a,b=None,label=None):
        n=node('ShaderNodeMath',label or op)
        n.operation=op
        connect(a,n.inputs[0])
        if b is not None:
            connect(b,n.inputs[1])
        return n.outputs[0]
    def vector(op,a,b):
        n=node('ShaderNodeVectorMath',op)
        n.operation=op
        connect(a,n.inputs[0])
        connect(b,n.inputs['Scale'] if op=='SCALE' else n.inputs[1])
        return n.outputs['Vector']
    def lerp(a,b,t):
        return vector('ADD',a,vector('SCALE',vector('SUBTRACT',b,a),t))
    def smooth(value,low=0,high=1):
        n=node('ShaderNodeMapRange','Quintic easing — continuous acceleration')
        n.interpolation_type='SMOOTHERSTEP'
        n.clamp=True
        connect(value,n.inputs['Value'])
        n.inputs['From Min'].default_value=low
        n.inputs['From Max'].default_value=high
        return n.outputs['Result']

    inp=node('NodeGroupInput','Ribbon control')
    # Ease velocity only at the first/last 18% of the stroke. This keeps
    # continuous acceleration without spending a second on an invisible tip.
    progress_value=inp.outputs['Progress']
    ramp=.18
    def integrated_ramp(value):
        t=math_node('MINIMUM',math_node('DIVIDE',value,ramp),1)
        return math_node('MULTIPLY',math_node('SUBTRACT',
            math_node('POWER',t,3),math_node('MULTIPLY',math_node('POWER',t,4),.5)),ramp)
    early=integrated_ramp(progress_value)
    late=math_node('SUBTRACT',1-ramp,integrated_ramp(math_node('SUBTRACT',1,progress_value)))
    middle=math_node('SUBTRACT',progress_value,ramp/2)
    early_weight=math_node('LESS_THAN',progress_value,ramp)
    late_weight=math_node('GREATER_THAN',progress_value,1-ramp)
    middle_weight=math_node('SUBTRACT',1,math_node('ADD',early_weight,late_weight))
    growth=math_node('DIVIDE',math_node('ADD',math_node('ADD',
        math_node('MULTIPLY',early,early_weight),math_node('MULTIPLY',late,late_weight)),
        math_node('MULTIPLY',middle,middle_weight)),1-ramp)
    position=node('GeometryNodeInputPosition','Parameter coordinates')
    split=node('ShaderNodeSeparateXYZ','Along / across')
    links.new(position.outputs[0],split.inputs[0])
    along, across=split.outputs['X'],split.outputs['Y']
    lookup_node=node('GeometryNodeObjectInfo','Paired rails at equal arc-length intervals')
    lookup_node.inputs['Object'].default_value=lookup
    lookup_node.transform_space='ORIGINAL'
    index=math_node('MULTIPLY',math_node('MULTIPLY',along,growth),len(rails)-1)
    base=math_node('FLOOR',index)
    following=math_node('MINIMUM',math_node('ADD',base,1),len(rails)-1)
    fraction=math_node('FRACT',index)
    def sample(label):
        attr=node('GeometryNodeInputNamedAttribute',label+' rail')
        attr.data_type='FLOAT_VECTOR'
        attr.inputs['Name'].default_value=label
        sampled=[]
        for idx in [base,following]:
            n=node('GeometryNodeSampleIndex',label+' sample')
            n.data_type='FLOAT_VECTOR'
            n.domain='POINT'
            n.clamp=True
            links.new(lookup_node.outputs['Geometry'],n.inputs['Geometry'])
            links.new(attr.outputs['Attribute'],n.inputs['Value'])
            connect(idx,n.inputs['Index'])
            sampled.append(n.outputs['Value'])
        return lerp(*sampled,fraction)
    left,right=sample('Left'),sample('Right')
    behind_tip=math_node('MULTIPLY',math_node('SUBTRACT',1,along),growth)
    completion=smooth(growth,.94,1)
    taper=math_node('SUBTRACT',1,math_node('MULTIPLY',
        math_node('SUBTRACT',1,smooth(behind_tip,0,.05)),math_node('SUBTRACT',1,completion)))
    width=math_node('ADD',.5,math_node('MULTIPLY',math_node('SUBTRACT',across,.5),taper))
    surface=lerp(left,right,width)
    arch=math_node('MULTIPLY',math_node('SINE',math_node('MULTIPLY',across,math.pi)),taper)
    lip=math_node('POWER',math_node('DIVIDE',behind_tip,.075),2)
    lip=math_node('MULTIPLY',math_node('EXPONENT',math_node('MULTIPLY',lip,-1)),
                  math_node('SUBTRACT',1,completion))
    depth=math_node('MULTIPLY',arch,math_node('ADD',-bulge,math_node('MULTIPLY',lip,-.09)))
    offset=node('ShaderNodeCombineXYZ','Satin camber and curling free end')
    connect(depth,offset.inputs['Y'])
    setter=node('GeometryNodeSetPosition','Continuous surface — evaluated at subframes')
    links.new(inp.outputs['Geometry'],setter.inputs['Geometry'])
    connect(surface,setter.inputs['Position'])
    links.new(offset.outputs[0],setter.inputs['Offset'])
    empty=node('GeometryNodeDeleteGeometry','Exactly empty before the reveal begins')
    empty.domain='POINT'
    links.new(setter.outputs[0],empty.inputs['Geometry'])
    connect(math_node('LESS_THAN',growth,1e-9),empty.inputs['Selection'])
    out=node('NodeGroupOutput','Finished ribbon')
    links.new(empty.outputs[0],out.inputs['Geometry'])
    # Lay out the procedural graph for inspection in Blender.
    for index,n in enumerate(nodes):
        n.location=((index%10)*220,-(index//10)*220)

    mod=ob.modifiers.new('Continuous unfurl / arc length','NODES')
    mod.node_group=tree
    control=getattr(mod.properties.inputs,progress.identifier)
    bpy.context.preferences.edit.keyframe_new_interpolation_type='LINEAR'
    control.value=0.
    control.keyframe_insert(data_path='value',frame=start)
    control.value=1.
    control.keyframe_insert(data_path='value',frame=finish)
    bpy.context.preferences.edit.keyframe_new_interpolation_type='BEZIER'
    solid=ob.modifiers.new('Anodized metal / 7 mm','SOLIDIFY')
    solid.thickness=.007
    solid.offset=0
    solid.material_offset=1
    solid.material_offset_rim=2
    bevel=ob.modifiers.new('Soft polished edge','BEVEL')
    bevel.width=.0025
    bevel.segments=2
    ob['reveal_start']=start
    ob['reveal_finish']=finish
    ob['progress_socket']=progress.identifier
    return ob
