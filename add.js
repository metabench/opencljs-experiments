var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;

var mod_write_kernel = require('./write-kernel');

var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;
var write_binary_operation_kernel = mod_write_kernel.write_binary_operation_kernel;

// Perhaps running a kernel just once (or on one set of data) will not be so useful.
// Run kernel over set, get results, repeat...

// maybe need a better way of parsing variable names.
//  hard to get single values like this...

//  except if we could get a and b turned into the local variables...

// definitely would be useful to be able to parse C++ can change it.
//  clang looks applicable.

// May be best to use local varables for a and b for the moment.


var k2s = write_binary_operation_kernel('vecAdd', Float32Array, 'return a + b;')

//var k2s = write_kernel('vecAdd', [['a', Float32Array], ['b', Float32Array]], ['output', Float32Array], `
//  res = a[id] + b[id];
//`);



// Function that returns two results per item...?



// Kernel that can execute with a different number of results being made to the input data.





// Averaging numbers...
// Can probably get the averages from groups quickly.
//  Looks like it would need a divide and conquor algorithm.





console.log('k2s', k2s);

var kernelSource = k2s;
var size = 255;
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

popencl.add_buffer('A', size);
popencl.add_buffer('B', size);
popencl.add_buffer('Res', size);

popencl.add_kernel('vecAdd', kernelSource);
// Let's set the first two buffers.
popencl.set_buffer('A', a);
popencl.set_buffer('B', b);
// Queue input buffers, single output buffer.
//  Only will be one output buffer I think.
var start_time = process.hrtime();
//popencl.execute_kernel('vecAdd', ['A', 'B'], 'Res');
popencl.execute_kernel('vecAdd', ['A', 'B'], 'Res');
var time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);
//popencl.execute_kernel(['A', 'B'], ['Res']);
popencl.get_buffer('Res', res);
// Then let's execute the kernel on the buffer.
//console.log('res', res);
console.log('time_diff', time_diff);
console.log('res', res);