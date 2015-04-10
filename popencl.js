// Maybe a non-'harmony' version would be better?
//  Or use Babel with iojs?
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var arrayify = jsgui.arrayify;
var tof = jsgui.tof;
var smalloc = require('smalloc');
var smalloc_length = require('../smalloc-length/build/Release/smalloc-length.node');
//'use strict';
var CPP_Obj = require('./cpp/build/release/ocl.node').MyObject;

var mod_write_kernel = require('./write-kernel');

var write_kernel_all_size_params = mod_write_kernel.write_kernel_all_size_params;
var write_kernel = mod_write_kernel.write_kernel;
var write_counted_reduction_kernels = mod_write_kernel.write_counted_reduction_kernels;


var POpenCL = jsgui.Class.extend({
  'init': function(spec) {
    this.cpp_obj = new CPP_Obj();
  },
  'add_buffer': function(name, size) {
    //console.log('add_buffer');


    return this.cpp_obj.add_buffer(name, size);
  },
  'add_kernel': function(name, source) {
    return this.cpp_obj.add_kernel(name, source);
  },

  'add_counted_reduction_kernels': function(name, type, reduction_factor, prepare, repeat, conclude) {
    //var kernels = new Array(2);

    var kernels = write_counted_reduction_kernels(name, type, reduction_factor, prepare, repeat, conclude);

    // need the kernel names...

    //console.log('kernels[0].name', kernels[0].name);

    this.add_kernel(kernels[0][0], kernels[0][1]);
    this.add_kernel(kernels[1][0], kernels[1][1]);

    return kernels;

  },

  'set_buffer': function(name, value) {
    return this.cpp_obj.set_buffer(name, value);
  },

  'setup_reduction_buffers': function(name_prefix, type, size, reduction_factor) {
    var n_stage = 0;
    var stage_sizes = [];
    var stage_size = size;
    //var stage_results = [];
    //var stage_input_count_buffers = [];

    stage_sizes.push(stage_size);

    var buffer_names = [];


    while (stage_size > 1) {

      // Does not need to use smalloc here to actually create the buffers.
      //  Though it could smalloc a single result buffer?



      stage_reduced_size = Math.ceil(stage_size / reduction_factor);
      //console.log('stage_reduced_size', stage_reduced_size);


      // TODO: Pay attention to the buffer types

      //stage_results.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Float));

      //stage_input_count_buffers.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Uint32));

      //console.log('n_stage', n_stage);


      //console.log(name_prefix + '_' + n_stage);

      var b_res = name_prefix + '_' + n_stage;
      var b_res_counts = b_res + '_input_counts';

      buffer_names.push(b_res, b_res_counts);


      this.add_buffer(b_res, stage_reduced_size);
      this.add_buffer(b_res_counts, stage_reduced_size);

      stage_size = stage_reduced_size;
      stage_sizes.push(stage_size);
      n_stage++;
    }

    return [stage_sizes, buffer_names];
  },

  'get_buffer': function(name, value) {
    return this.cpp_obj.get_buffer(name, value);
  },
  'get_buffer_size': function(name) {
    return this.cpp_obj.get_buffer_size(name);
  },
  'execute_kernel': function(name, input_param_names, output_param_name) {
    // execute_kernel('vecAdd', ['A', 'B'], 'Res');
    return this.cpp_obj.execute_kernel(name, input_param_names, output_param_name);
  },
  'execute_kernel_all_size_params': function(name, param_names) {
    return this.cpp_obj.execute_kernel_all_size_params(name, param_names);
  },

  'execute_counted_reduction': function(name, obj_kernel_instructions, input_buffer, data_type) {

    // the input buffer could be a string reference to an existing OpenCL buffer.
    //  Could have a way to leave the result in OpenCL memory... but will do that later.
    //  Transferring the result is much quicker than transferring the input.





    var reduction_factor = 8;

    // but maybe we have not been given an input buffer.
    //  may be referring to the existing buffer.
    //  should be able to get the buffer size from the C++.






    var size;


    var counted_reduction_kernel_name = 'counted_reduce_' + name;
    var counted_output_reduction_kernel_name = 'counted_output_reduce_' + name;


    var start_time = process.hrtime();

    var counted_reduction_kernels = this.add_counted_reduction_kernels(counted_reduction_kernel_name, data_type, reduction_factor,
    /* prepare    */ `double min = INFINITY;`,
    /* repeat     */ `if(val < min) min = val;`,
    /* conclude   */ `return min;`);


    var time_diff = process.hrtime(start_time);


    console.log('kernel create time: ', time_diff);



    var t_input_buffer = tof(input_buffer);

    console.log('t_input_buffer', t_input_buffer);

    var input_buffer_name;

    if (t_input_buffer === 'string') {

      input_buffer_name = input_buffer;
      size = this.get_buffer_size(input_buffer_name);
    } else {
      size = smalloc_length(input_buffer);
      // Otherwise it's an object

      input_buffer_name = 'a';

      var start_time = process.hrtime();

      this.add_buffer(input_buffer_name, size);

      this.set_buffer(input_buffer_name, input_buffer);


      var time_diff = process.hrtime(start_time);


      console.log('input buffer(a) load time: ', time_diff);


    }






    var res_setup_buffers = this.setup_reduction_buffers('res', data_type, size, reduction_factor);



    var stage_sizes = res_setup_buffers[0];
    var res_buffer_names = res_setup_buffers[1];
    //console.log('stage_sizes', stage_sizes);
    //var stage_results = res_setup_buffers[1];
    //var stage_input_count_buffers = res_setup_buffers[2];

    var n_stage = stage_sizes.length - 2;
    //console.log('n_stage', n_stage);


    // keep a map of named OpenCL buffers that are made.
    // After we have the result, we dont't need to keep the OpenCL buffers.



    // Let's set the first two buffers.

    // This looks like it's where it's taking most of the time.
    //  Do need to load some buffers at times, at other times can keep data within GPU buffered memory.
    //  Some AMD architectures look like they could be loads faster for this... maybe worth a look.





    // time to load input buffer...


    //this.set_buffer('a', input_buffer);



    //console.log('counted_reduction_kernel_name', counted_reduction_kernel_name);
    //this.execute_reduction_kernel('counted_reduce_min', 'a', 'res', n_stage);

    //console.log('input_buffer_name', input_buffer_name);
    var level = 1;
    var prev_level;

    var start_time = process.hrtime();

    this.execute_kernel_all_size_params(counted_output_reduction_kernel_name, [input_buffer_name, 'res_0', 'res_0_input_counts']);

    //var easp = this.execute_kernel_all_size_params;

    while (level <= n_stage) {
      prev_level = level - 1;
      this.execute_kernel_all_size_params(counted_reduction_kernel_name, ['res_' + prev_level, 'res_' + prev_level + '_input_counts', 'res_' + level, 'res_' + level + '_input_counts']);
      level++;
    }

    var time_diff = process.hrtime(start_time);


    console.log('actual kernel execution time: ', time_diff);




    //time_diff = process.hrtime(start_time);


    //console.log('n_stage', n_stage);

    // Just need the last input buffer...
    //  In fact we just need a buffer with size 2.

    var res_buffer = smalloc.alloc(1, smalloc.Types.Float);


    //console.log('time_diff', time_diff);

    //
    //console.log('pre get buffer');



    this.get_buffer('res_' + n_stage, res_buffer);
    //console.log('post get buffer');

    //this.get_buffer('res_' + n_stage + '_input_counts', stage_input_count_buffers[n_stage]);

    //var last_res_buffer = stage_results[n_stage];
    //var last_input_count_buffers = stage_input_count_buffers[n_stage];

    //console.log('last_res_buffer[0]', last_res_buffer[0]);
    //console.log('last_input_count_buffers[0]', last_input_count_buffers[0]);

    //console.log('res_setup_buffers', res_setup_buffers);

    var res = res_buffer[0];
    smalloc.dispose(res_buffer);

    // Then we can deallocate all the OpenCL buffers.
    //  Deallocate the res_buffer too, when returning the res variable.

    ///console.log('res_buffer_names', res_buffer_names);

    //console.log('pre release buffers');


    var start_time = process.hrtime();
    this.release_buffer(res_buffer_names);
    var time_diff = process.hrtime(start_time);
    // 17, reduced by a factor of 128 would go to 1
    console.log('buffers release time: ', time_diff);

    return res;

  },

  'execute_counted_reduction_kernel': function(name, input_buffer_name, output_buffer_name, num_stages) {
    // This may be able to work out the number of stages from the input buffers
    //  could save the reduction factors with the kernels

    // The kernel could include the reduction factor as well.

    // It may be worth making an OO kernel in JavaScript.
    //  It would hold the kernel code, and also structured information about what it does, how it does it.
    //  Possibly should hold what the kernel was produced from.
    // An object that represents both the kernel, and the intentions behind it, and info on what buffers it needs.

    // Seems like an OO PKernel or Kernel would do the job.
    //  Probably call it P for Procedural. Main intent is to do OpenCL procedures.





  },

  // and release buffer

  'release_buffer': arrayify(function(buffer_name) {
    //console.log('js release_buffer');

    var start_time = process.hrtime();
    this.cpp_obj.release_buffer(buffer_name);
    var time_diff = process.hrtime(start_time);
    // 17, reduced by a factor of 128 would go to 1
    //console.log('cpp_obj.release_buffer time: ', time_diff);




  }),



  'release_all': function() {
    return this.cpp_obj.release_all();
  }
});

module.exports = POpenCL;
