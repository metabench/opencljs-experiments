// Maybe a non-'harmony' version would be better?
//  Or use Babel with iojs?
var jsgui = require('../../ws/js/core/jsgui-lang-essentials');

//'use strict';
var CPP_Obj = require('./cpp/build/release/ocl.node').MyObject;

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
  'set_buffer': function(name, value) {
    return this.cpp_obj.set_buffer(name, value);
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
