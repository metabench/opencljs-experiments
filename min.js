var POpenCL = require('./popencl');
//var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
var smalloc_length = require('../smalloc-length/build/Release/smalloc-length.node');
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var each = jsgui.eac;
var mod_write_kernel = require('./write-kernel');
var write_counted_reduction_kernels = mod_write_kernel.write_counted_reduction_kernels;
var write_counted_reduction_kernel = mod_write_kernel.write_counted_reduction_kernel;
var write_counted_output_reduction_kernel = mod_write_kernel.write_counted_output_reduction_kernel;
var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;

var size = 120000000;
var popencl = new POpenCL();

var reduction_factor = 8;
console.log('initializing data');

var a = smalloc.alloc(size, smalloc.Types.Float);
var start_time = process.hrtime();
for (var c = 0; c < size; c++) {
    //a[c] = c * 4 + 1;

    if (c % 16 === 0) {
      a[c] = 10;
    } else {
      a[c] = 2;
    }
}

var time_diff = process.hrtime(start_time);
console.log('JavaScript init data time: ', time_diff);

start_time = process.hrtime();
var min = popencl.execute_counted_reduction('min', {
  'prepare': `double min = INFINITY;`,
  'repeat': `if(val < min) min = val;`,
  'conclude': `return min;`
}, a, 'float');
time_diff = process.hrtime(start_time);
popencl.release_all();
// 17, reduced by a factor of 128 would go to 1
console.log('execute_counted_reduction time: ', time_diff);


console.log('min', min);
