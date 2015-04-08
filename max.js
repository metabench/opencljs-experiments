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

//var size = 1000;
// 21829262
// 51286125
//var size = 16;

// Perhaps we could get the smalloc size from C++?

// Maybe smalloc-length would be a useful plugin.




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

    //a[c] = c * 20 - Math.random() * 50000;


    //a[c] = c * 20282;
    //a[c] = c * 14000 - (c * 3) ^ 2 ;
}
var time_diff = process.hrtime(start_time);
// 17, reduced by a factor of 128 would go to 1
console.log('JavaScript init data time: ', time_diff);

var k3s;

// could have a counted reduce function have a wr prefix?


var ks_reduce_average = write_counted_reduction_kernels('weighted_reduce_max', Float32Array, reduction_factor,
/* prepare    */ `double max = -INFINITY;`,
/* repeat     */ `if(val > max) max = val;`,
/* conclude   */ `return max;`
);

var k_weighted_output_reduce_average = ks_reduce_average[0][1];
var k_weighted_reduce_average = ks_reduce_average[1][1];


var popencl = new POpenCL();


console.log('ks_reduce_average[0]', ks_reduce_average[0]);

var stage_reduced_size;


var stage_sizes = [];
var stage_results = [];
var stage_input_count_buffers = [];

stage_sizes.push(size);

// what about giving the buffer itself?

// or being able to get a buffer object more directly?
//  something that applies to GPU memory.
//   possibly not worth it, or it would have unusual performance characteristics. Could be very fast at some things.







popencl.add_buffer('a', size);

popencl.add_kernel('weighted_output_reduce_max', k_weighted_output_reduce_average);
popencl.add_kernel('weighted_reduce_max', k_weighted_reduce_average);
// Could have something in popencl to run a reduction kernel, and allocate the needed memory.



// setup_reduction_res_buffers(stage_size, reduction_factor)

// could give them the name 'res' by default?
//  or it could automatically name them.
// maybe bearing in mind there could be multiple reductions.






// setup_reduction_buffers(name_prefix, type, stage_size, reduction_factor)


// Set up the stage buffers
var stage_size = size;
var n_stage = 0;
while (stage_size > 1) {
  stage_reduced_size = Math.ceil(stage_size / reduction_factor);
  //console.log('stage_reduced_size', stage_reduced_size);

  stage_results.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Float));
  stage_input_count_buffers.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Uint32));

  //console.log('n_stage', n_stage);

  popencl.add_buffer('res_' + n_stage, stage_reduced_size);
  popencl.add_buffer('res_' + n_stage + '_input_counts', stage_reduced_size);

  stage_size = stage_reduced_size;
  n_stage++;
}
n_stage--;



popencl.set_buffer('a', a);

start_time = process.hrtime();
// First reduction, factor of 128, but it's not necessary to have the full 128 items, or have a number of items that's divisible by 128.

popencl.execute_kernel_all_size_params('weighted_output_reduce_max', ['a', 'res_0', 'res_0_input_counts']);

var level = 1;

while (level <= n_stage) {
  var prev_level = level - 1;
  popencl.execute_kernel_all_size_params('weighted_reduce_max', ['res_' + prev_level, 'res_' + prev_level + '_input_counts', 'res_' + level, 'res_' + level + '_input_counts']);
  level++;
}


time_diff = process.hrtime(start_time);
//popencl.vector_add(a, b, res);
//popencl.execute_kernel(['A', 'B'], ['Res']);

//popencl.get_buffer('Res_0', stage_results[0]);
//popencl.get_buffer('Res_0_input_counts', stage_input_count_buffers[0]);
//popencl.get_buffer('Res_1', stage_results[1]);
//popencl.get_buffer('Res_1_input_counts', stage_input_count_buffers[1]);


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
