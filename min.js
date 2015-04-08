var POpenCL = require('./popencl');

//var POpenCL = require('./cpp/build/release/ocl.node').MyObject;
var smalloc = require('smalloc');
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
//var size = 1000;
// 21829262
// 51286125
//var size = 16;

var reduction_factor = 8;
console.log('initializing data');

var a = smalloc.alloc(size, smalloc.Types.Float);
var c;
var start_time = process.hrtime();
for (c = 0; c < size; c++) {
    //a[c] = c * 4 + 1;

    if (c % 16 === 0) {
      a[c] = 10;
    } else {
      a[c] = 2;
    }
}
var time_diff = process.hrtime(start_time);
// 17, reduced by a factor of 128 would go to 1
console.log('JavaScript init data time: ', time_diff);

var k3s;

popencl.add_counted_reduction_kernels('counted_reduce_min', Float32Array, reduction_factor,
/* prepare    */ `double min = INFINITY;`,
/* repeat     */ `if(val < min) min = val;`,
/* conclude   */ `return min;`);

var stage_size = size;
var stage_reduced_size;

popencl.add_buffer('a', size);

var res_setup_buffers = popencl.setup_reduction_buffers('res', smalloc.Types.Float, stage_size, reduction_factor);

var stage_sizes = res_setup_buffers[0];
var stage_results = res_setup_buffers[1];
var stage_input_count_buffers = res_setup_buffers[2];

var n_stage = stage_sizes.length - 1;

// Let's set the first two buffers.
popencl.set_buffer('a', a);

start_time = process.hrtime();
// First reduction, factor of 128, but it's not necessary to have the full 128 items, or have a number of items that's divisible by 128.

popencl.execute_kernel_all_size_params('counted_output_reduce_min', ['a', 'res_0', 'res_0_input_counts']);

var level = 1;

while (level <= n_stage) {
  var prev_level = level - 1;
  popencl.execute_kernel_all_size_params('counted_reduce_min', ['res_' + prev_level, 'res_' + prev_level + '_input_counts', 'res_' + level, 'res_' + level + '_input_counts']);
  level++;
}

time_diff = process.hrtime(start_time);


console.log('n_stage', n_stage);
console.log('time_diff', time_diff);

popencl.get_buffer('res_' + n_stage, stage_results[n_stage]);
popencl.get_buffer('res_' + n_stage + '_input_counts', stage_input_count_buffers[n_stage]);

var last_res_buffer = stage_results[n_stage];
var last_input_count_buffers = stage_input_count_buffers[n_stage];

console.log('last_res_buffer[0]', last_res_buffer[0]);
console.log('last_input_count_buffers[0]', last_input_count_buffers[0]);

// And deallocate buffers and kernels in popencl.
popencl.release_all();
