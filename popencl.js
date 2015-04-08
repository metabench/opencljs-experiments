// Maybe a non-'harmony' version would be better?
//  Or use Babel with iojs?
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');
var smalloc = require('smalloc');
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

    console.log('kernels[0].name', kernels[0].name);

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
    var stage_results = [];
    var stage_input_count_buffers = [];

    stage_sizes.push(stage_size);


    while (stage_size > 1) {
      stage_reduced_size = Math.ceil(stage_size / reduction_factor);
      console.log('stage_reduced_size', stage_reduced_size);

      stage_results.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Float));
      stage_input_count_buffers.push(smalloc.alloc(stage_reduced_size, smalloc.Types.Uint32));

      console.log('n_stage', n_stage);

      this.add_buffer(name_prefix + '_' + n_stage, stage_reduced_size);
      this.add_buffer(name_prefix + '_' + n_stage + '_input_counts', stage_reduced_size);

      stage_size = stage_reduced_size;
      n_stage++;
    }
    return [stage_sizes, stage_results, stage_input_count_buffers];
  },

  'get_buffer': function(name, value) {
    return this.cpp_obj.get_buffer(name, value);
  },
  'execute_kernel': function(name, input_param_names, output_param_name) {
    // execute_kernel('vecAdd', ['A', 'B'], 'Res');
    return this.cpp_obj.execute_kernel(name, input_param_names, output_param_name);
  },
  'execute_kernel_all_size_params': function(name, param_names) {
    return this.cpp_obj.execute_kernel_all_size_params(name, param_names);
  },
  'release_all': function() {
    return this.cpp_obj.release_all();
  }
});

module.exports = POpenCL;
