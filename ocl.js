var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var write_kernel = require('./write-kernel');

// Perhaps running a kernel just once (or on one set of data) will not be so useful.
// Run kernel over set, get results, repeat...

var k2s = write_kernel('vecAdd', [['a', Float32Array], ['b', Float32Array]], ['res', Float32Array], `
  res[id] = a[id] + b[id];
`);


console.log('k2s', k2s);

var kernelSource = k2s;
var size = 16;
var a = smalloc.alloc(size, smalloc.Types.Float);
var b = smalloc.alloc(size, smalloc.Types.Float);
var res = smalloc.alloc(size, smalloc.Types.Float);
var c;
for (c = 0; c < size; c++) {
    a[c] = c;
    b[c] = c * 2;
    res[c] = 0;
}
// We can give it the kernel.
var popencl = new POpenCL();

popencl.add_buffer('A', 16);
popencl.add_buffer('B', 16);
popencl.add_buffer('Res', 16);
popencl.add_kernel('vecAdd', kernelSource);
// Let's set the first two buffers.
popencl.set_buffer('A', a);
popencl.set_buffer('B', b);
// Queue input buffers, single output buffer.
//  Only will be one output buffer I think.
var start_time = process.hrtime();
popencl.execute_kernel('vecAdd', ['A', 'B'], 'Res');
var time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);
//popencl.execute_kernel(['A', 'B'], ['Res']);
popencl.get_buffer('Res', res);
// Then let's execute the kernel on the buffer.
//console.log('res', res);
console.log('time_diff', time_diff);
console.log('res', res);
