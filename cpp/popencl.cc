#include <iostream>
#include <stdlib.h>
#include <vector>
#include <map>
#include "popencl.h"

using namespace v8;
using namespace std;

Persistent<Function> MyObject::constructor;


#include <CL/cl.h>

// This will in a sense be a VM.
// Want to give it a few specific capabilities.
// Could use chunks of allocated memory.
//  Some would be more dynamically sized.

// Also, would be interesting to just run a kernel once.








const char *kernelSource =                                       "\n" \
"#pragma OPENCL EXTENSION cl_khr_fp64 : enable                    \n" \
"__kernel void vecAdd(  __global float *a,                       \n" \
"                       __global float *b,                       \n" \
"                       __global float *c,                       \n" \
"                       const unsigned int n)                    \n" \
"{                                                               \n" \
"    //Get our global thread ID                                  \n" \
"    int id = get_global_id(0);                                  \n" \
"                                                                \n" \
"    //Make sure we do not go out of bounds                      \n" \
"    if (id < n)                                                 \n" \
"        c[id] = a[id] + b[id];                                  \n" \
"}                                                               \n" \
                                                                "\n" ;



// Collections of
// buffers
// source + program + kernel





// Want different kernel sources, all get compiled.

// Maybe using standard library strings will be easier.

unsigned int i_vector = 0;

//std::string kernelSource;

std::vector<std::string> vector_kernel_sources(100);
std::vector<cl_program> vector_programs(100);
std::vector<cl_kernel> vector_kernels(100);
std::map<std::string, unsigned int> map_kernel_indexes_by_name;

unsigned int i_buffer = 0;

std::vector<cl_mem> cl_buffers(100);
std::vector<unsigned int> cl_buffer_sizes(100);
std::map<std::string, unsigned int> map_buffer_indexes_by_name;




//cl_program program;               // program
//cl_kernel kernel;                 // kernel

//char * kernelSource;

// We could make the kernel come in from JavaScript.
// For the moment want to set just one kernel.

// Perhaps the OpenCL machine could handle





// Could we initialize the kernel and opencl device when it loads?

cl_platform_id cpPlatform;        // OpenCL platform
cl_device_id device_id;           // device ID
cl_context context;               // context


// I think all buffers will be read/write for the moment.

// Having decent abstractions will be useful.

// A time series (or maybe it's just series data) could be a useful abstraction to be dealing with.
// Also, general purpose Vector data.

// Being able to make use of some data structures within the OpenCL itself could be useful.
// For the moment though, want to make use of some fairly simple compute kernels.

// Dealing with multiple named kernels makes sense too.
// May require some kind of a map in C++.


cl_mem d_a;
cl_mem d_b;
// Device output buffer
cl_mem d_c;

cl_command_queue queue;           // command queue
cl_program program;               // program
//cl_kernel kernel;                 // kernel

// Size, in bytes, of each vector
size_t globalSize, localSize;
cl_int err;




/*
void FasterVectorAdd(unsigned int size, float* A, float* B, float* Res) {
    int i;

    cout << "FasterVectorAdd" << endl;

    globalSize = ceil(size/(float)localSize)*localSize;

    size_t bytes = size*sizeof(float);

    d_a = clCreateBuffer(context, CL_MEM_READ_ONLY, bytes, NULL, NULL);
    d_b = clCreateBuffer(context, CL_MEM_READ_ONLY, bytes, NULL, NULL);
    d_c = clCreateBuffer(context, CL_MEM_WRITE_ONLY, bytes, NULL, NULL);

    // Write our data set into the input array in device memory
    err = clEnqueueWriteBuffer(queue, d_a, CL_TRUE, 0, bytes, A, 0, NULL, NULL);
    err |= clEnqueueWriteBuffer(queue, d_b, CL_TRUE, 0, bytes, B, 0, NULL, NULL);

    // Set the arguments to our compute kernel
    err  = clSetKernelArg(kernel, 0, sizeof(cl_mem), &d_a);
    err |= clSetKernelArg(kernel, 1, sizeof(cl_mem), &d_b);
    err |= clSetKernelArg(kernel, 2, sizeof(cl_mem), &d_c);

    cout << "size" << size << endl;

    err |= clSetKernelArg(kernel, 3, sizeof(unsigned int), &size);

    cout << "globalSize " << globalSize << endl;
    cout << "localSize " << localSize << endl;

    // clEnqueueTask(command_queue, kernel[i], 0, NULL, NULL);
    //  That only enques a single task.
    //  May often be done in a loop, maybe with multiple kernels / tasks being used.


    // Execute the kernel over the entire range of the data set
    err = clEnqueueNDRangeKernel(queue, kernel, 1, NULL, &globalSize, &localSize, 0, NULL, NULL);

    // Wait for the command queue to get serviced before reading back results
    clFinish(queue);

    // Read the results from the device
    clEnqueueReadBuffer(queue, d_c, CL_TRUE, 0, bytes, Res, 0, NULL, NULL );

    //Sum up vector c and print result divided by n, this should equal 1 within error
    //double sum = 0;
    //for(i = 0; i < size; i++)
        //sum += r[i];
        //cout << Res[i] << endl;


    //printf("final result: %f\n", sum/n);

    // release OpenCL resources
    clReleaseMemObject(d_a);
    clReleaseMemObject(d_b);
    clReleaseMemObject(d_c);

    //clReleaseProgram(program);
    //clReleaseKernel(kernel);
    //clReleaseCommandQueue(queue);
    //clReleaseContext(context);

}
*/

// ExecuteKernel(kernel_id, input_buffer_ids, output_buffer_id);

// I think we need to return the result of the kernel directly.

void ExecuteKernel(unsigned int kernel_id, std::vector<unsigned int> input_buffer_ids, unsigned int output_buffer_id) {

    // Though maybe we should be specifying the size in bytes here.

    //

    cout << "output_buffer_id " << output_buffer_id << endl;
    cout << "kernel_id " << kernel_id << endl;


    unsigned int num_input_buffer_ids = input_buffer_ids.size();

    cl_kernel kernel = vector_kernels[kernel_id];

    unsigned int arg_idx = 0;


    for (unsigned int c = 0; c < num_input_buffer_ids; c++) {
        err  = clSetKernelArg(kernel, arg_idx++, sizeof(cl_mem), &cl_buffers[input_buffer_ids[c]]);
    }

    err = clSetKernelArg(kernel, arg_idx++, sizeof(cl_mem), &cl_buffers[output_buffer_id]);

    // The size of the execution?

    // look at the size of the 1st buffer for the moment?
    //  Maybe the last buffer?


    err = clSetKernelArg(kernel, arg_idx++, sizeof(unsigned int), &cl_buffer_sizes[output_buffer_id]);

    //size_t bytes = cl_buffer_sizes[output_buffer_id]*sizeof(float);

    cout << "cl_buffer_sizes[output_buffer_id] " << cl_buffer_sizes[output_buffer_id] << endl;

    globalSize = ceil(cl_buffer_sizes[output_buffer_id]/(float)localSize)*localSize;

    cout << "globalSize " << globalSize << endl;
    cout << "localSize " << localSize << endl;

    // globalSize = ceil(size/(float)localSize)*localSize;

    //unsigned int size = cl_buffer_sizes[idx_buffer];

    err = clEnqueueNDRangeKernel(queue, kernel, 1, NULL, &globalSize, &localSize, 0, NULL, NULL);


    // Wait for the command queue to get serviced before reading back results
    clFinish(queue);

    // Read the results from the device
    //clEnqueueReadBuffer(queue, cl_buffers[output_buffer_id], CL_TRUE, 0, cl_buffer_sizes[output_buffer_id], cl_buffers[output_buffer_id], 0, NULL, NULL );

    // Think we don't read it here.


    // err  = clSetKernelArg(kernel, 0, sizeof(cl_mem), &d_a);




}

void AddBuffer(std::string name, unsigned int size) {

    // Though maybe we should be specifying the size in bytes here.



    //unsigned int size = cl_buffer_sizes[idx_buffer];

    cout << "AddBuffer" << endl;
    size_t bytes = size*sizeof(float);

    cout << "bytes " << bytes << endl;


    cout << "pre clCreateBuffer" << endl;
    cl_buffers[i_buffer] = clCreateBuffer(context, CL_MEM_READ_WRITE, bytes, NULL, NULL);
    cl_buffer_sizes[i_buffer] = bytes;
    cout << "post clCreateBuffer" << endl;

    map_buffer_indexes_by_name[name] = i_buffer;

    i_buffer++;

    cout << "end AddBuffer" << endl;
}

void AddKernel(std::string name, std::string source) {
    // Have a vector of programs too

    // Not sure we need to keep the source.
    // May help to keep the kernel name...
    //  But we keep it in the vector.
    vector_kernel_sources[i_vector] = source;

    vector_programs[i_vector] = clCreateProgramWithSource(context, 1, (const char **) & source, NULL, &err);
    clBuildProgram(vector_programs[i_vector], 0, NULL, NULL, NULL, NULL);

    //cout << "TempNumOne " << TempNumOne << endl;
    //kernelSource = kernel_code;
    int kernel_name_size = name.size();
    char * temp_kernel_name = new char[kernel_name_size]();

    for (int a = 0; a <= kernel_name_size; a++) {
        temp_kernel_name[a] = name[a];
    }

    vector_kernels[i_vector] = clCreateKernel(vector_programs[i_vector], temp_kernel_name, &err);

    map_kernel_indexes_by_name[name] = i_vector;

    i_vector++;
}


// Change this so it's not creating buffers...

// Don't give it the size for the moment.
//  We know the size of the buffer.


/*
void SaveBuffer(std::string name, float* A) {
    unsigned int idx_buffer = map_buffer_indexes_by_name[name];
    unsigned int size = cl_buffer_sizes[idx_buffer];

    cout << "SaveBuffer" << endl;
    size_t bytes = size*sizeof(float);
    //cout << "pre clCreateBuffer" << endl;
    //d_a = clCreateBuffer(context, CL_MEM_READ_WRITE, bytes, NULL, NULL);
    //cout << "post clCreateBuffer" << endl;
    err = clEnqueueWriteBuffer(queue, d_a, CL_TRUE, 0,
                                       bytes, A, 0, NULL, NULL);
    cout << "post clEnqueueWriteBuffer" << endl;
    cout << "end SaveBuffer" << endl;
}
void LoadBuffer(unsigned int size, float* A) {
    cout << "_LoadBuffer" << endl;
    size_t bytes = size*sizeof(float);
    err = clEnqueueReadBuffer(queue, d_a, CL_TRUE, 0, bytes, A, 0, NULL, NULL );

    cout << "done _LoadBuffer" << endl;
}
*/

void SetBuffer(std::string name, float* A) {
    unsigned int idx_buffer = map_buffer_indexes_by_name[name];
    unsigned int size = cl_buffer_sizes[idx_buffer];
    cout << "SetBuffer" << endl;


    //size_t bytes = size*sizeof(float);
    //cout << "pre clCreateBuffer" << endl;
    //d_a = clCreateBuffer(context, CL_MEM_READ_WRITE, bytes, NULL, NULL);
    //cout << "post clCreateBuffer" << endl;
    err = clEnqueueWriteBuffer(queue, cl_buffers[idx_buffer], CL_TRUE, 0, size, A, 0, NULL, NULL);
}

void GetBuffer(std::string name, float* A) {
    unsigned int idx_buffer = map_buffer_indexes_by_name[name];
    unsigned int size = cl_buffer_sizes[idx_buffer];
    cout << "GetBuffer" << endl;
    //cout << "_LoadBuffer" << endl;
    //size_t bytes = size*sizeof(float);
    err = clEnqueueReadBuffer(queue, cl_buffers[idx_buffer], CL_TRUE, 0, size, A, 0, NULL, NULL );
    cout << "done GetBuffer" << endl;
}

/*

void SaveBuffer(unsigned int size, float* A) {
    cout << "_SaveBuffer" << endl;
    size_t bytes = size*sizeof(float);
    cout << "pre clCreateBuffer" << endl;
    d_a = clCreateBuffer(context, CL_MEM_READ_WRITE, bytes, NULL, NULL);
    cout << "post clCreateBuffer" << endl;
    err = clEnqueueWriteBuffer(queue, d_a, CL_TRUE, 0,
                                       bytes, A, 0, NULL, NULL);
    cout << "post clEnqueueWriteBuffer" << endl;

    cout << "end _SaveBuffer" << endl;
}
*/



// Function to run kernel, using 3 buffers / registers.

// Will be good to make a version for when the buffers have already been loaded...
//  and time it too
//  nice if it were very fast.

// I guess this one needs to create the buffers here...

// But what if there were read-write buffers as part of the system.

// Perhaps it could automatically set up three read-write buffers of sizes spedified in the JavaScript.

// Create buffer...
//  And it would be a named buffer (I think)

// In the JS we could create various buffers to hold various pieces of data.
//  The buffer may have already been written in JavaScript, then it gets copied into GPU memory.
//   That would help with knowing the size of the buffer to allocate.

// Would definitely be nice to have JavaScript set up some of this VM.






/*

void VecAdd(unsigned int size, float* A, float* B, float* Res)
{
    // Length of vectors
    //unsigned int n = 100000;

    // Host input vectors
    //double *h_a;
    //double *h_b;
    // Host output vector
    //double *h_c;

    // Device input buffers


    //cout << "bytes " << bytes << endl;

    //cout << "A[0] " << A[0] << endl;

    // Should not need to allocate the momory.
    //  Can we use float arrays, which are mapped to typed arrays?

    // Allocate memory for each vector on host
    //h_a = (double*)malloc(bytes);
    //h_b = (double*)malloc(bytes);
    //h_c = (double*)malloc(bytes);

    // Initialize vectors on host
    int i;

    size_t bytes = size*sizeof(float);

    // Maybe we should try taking in some JavaScript typed arrays

    //for( i = 0; i < n; i++ )
    //{
        //h_a[i] = sinf(i)*sinf(i);
        //h_b[i] = cosf(i)*cosf(i);

    //    h_a[i] = i;
    //    h_b[i] = i - 5;
    //}
    // Number of work items in each local work group
    localSize = 64;

    // Number of total work items - localSize must be devisor
    globalSize = ceil(size/(float)localSize)*localSize;

    // Bind to platform
    err = clGetPlatformIDs(1, &cpPlatform, NULL);

    // Get ID for the device
    err = clGetDeviceIDs(cpPlatform, CL_DEVICE_TYPE_GPU, 1, &device_id, NULL);

    // Create a context
    context = clCreateContext(0, 1, &device_id, NULL, NULL, &err);

    // Create a command queue
    queue = clCreateCommandQueue(context, device_id, 0, &err);

    // Create the compute program from the source buffer
    program = clCreateProgramWithSource(context, 1,
                            (const char **) & kernelSource, NULL, &err);

    // Build the program executable
    clBuildProgram(program, 0, NULL, NULL, NULL, NULL);

    // Create the compute kernel in the program we wish to run
    kernel = clCreateKernel(program, "vecAdd", &err);

    // Create the input and output arrays in device memory for our calculation
    d_a = clCreateBuffer(context, CL_MEM_READ_ONLY, bytes, NULL, NULL);
    d_b = clCreateBuffer(context, CL_MEM_READ_ONLY, bytes, NULL, NULL);
    d_c = clCreateBuffer(context, CL_MEM_WRITE_ONLY, bytes, NULL, NULL);

    // Write our data set into the input array in device memory
    err = clEnqueueWriteBuffer(queue, d_a, CL_TRUE, 0,
                                   bytes, A, 0, NULL, NULL);
    err |= clEnqueueWriteBuffer(queue, d_b, CL_TRUE, 0,
                                   bytes, B, 0, NULL, NULL);

    // Set the arguments to our compute kernel
    err  = clSetKernelArg(kernel, 0, sizeof(cl_mem), &d_a);
    err |= clSetKernelArg(kernel, 1, sizeof(cl_mem), &d_b);
    err |= clSetKernelArg(kernel, 2, sizeof(cl_mem), &d_c);
    err |= clSetKernelArg(kernel, 3, sizeof(unsigned int), &size);

    // Execute the kernel over the entire range of the data set
    err = clEnqueueNDRangeKernel(queue, kernel, 1, NULL, &globalSize, &localSize,
                                                              0, NULL, NULL);

    // Wait for the command queue to get serviced before reading back results
    clFinish(queue);

    // Read the results from the device
    clEnqueueReadBuffer(queue, d_c, CL_TRUE, 0,
                                bytes, Res, 0, NULL, NULL );

    //Sum up vector c and print result divided by n, this should equal 1 within error
    //double sum = 0;
    //for(i = 0; i < size; i++)
        //sum += r[i];
        //cout << Res[i] << endl;


    //printf("final result: %f\n", sum/n);

    // release OpenCL resources
    clReleaseMemObject(d_a);
    clReleaseMemObject(d_b);
    clReleaseMemObject(d_c);
    clReleaseProgram(program);
    clReleaseKernel(kernel);
    clReleaseCommandQueue(queue);
    clReleaseContext(context);

    //release host memory

    // Don't think we free these, because we still want them in JavaScriptLand.
    //free(h_a);
    //free(h_b);
    //free(h_c);

    //return 0;
}
*/



//MyObject::MyObject(double value) : value_(value) {
//}

MyObject::~MyObject() {
}

void MyObject::Init(Handle<Object> exports) {
  NanScope();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = NanNew<FunctionTemplate>(New);
  tpl->SetClassName(NanNew("MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "vector_add", NAN_VectorAdd);

  NODE_SET_PROTOTYPE_METHOD(tpl, "add_buffer", NAN_AddBuffer);
  NODE_SET_PROTOTYPE_METHOD(tpl, "set_buffer", NAN_SetBuffer);
  NODE_SET_PROTOTYPE_METHOD(tpl, "get_buffer", NAN_GetBuffer);

  NODE_SET_PROTOTYPE_METHOD(tpl, "add_kernel", NAN_AddKernel);
  NODE_SET_PROTOTYPE_METHOD(tpl, "execute_kernel", NAN_ExecuteKernel);

  //NODE_SET_PROTOTYPE_METHOD(tpl, "save_buffer", NAN_SaveBuffer);
  //NODE_SET_PROTOTYPE_METHOD(tpl, "load_buffer", NAN_LoadBuffer);




  NanAssignPersistent(constructor, tpl->GetFunction());
  exports->Set(NanNew("MyObject"), tpl->GetFunction());
}

NAN_METHOD(MyObject::New) {
  NanScope();

  if (args.IsConstructCall()) {

    // The first argument will be the kernel source.

    // Invoked as constructor: `new MyObject(...)`
    //double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();

    // kernelSource

    //Local<Object> obj = args[0].As<Object>();

    // Don't add the kernel in the contructor.

    /*

    std::string opencl_fn_name (*NanAsciiString(args[0]));
    cout << "opencl_fn_name " << opencl_fn_name << endl;

    std::string kernel_code(*NanAsciiString(args[1]));
    cout << "kernel_code " << kernel_code << endl;

    //kernelSource = kernel_code.c_str();

    int TempNumOne = kernel_code.size();
    cout << "TempNumOne " << TempNumOne << endl;

    */



    //kernelSource = kernel_code;

    //kernelSource = new char[TempNumOne]();

    //for (int a=0; a <= TempNumOne; a++) {
    //    kernelSource[a] = kernel_code[a];
    //}

    //cout << "Done copy" << endl;

    //kernelSource = char(kernel_code);

    /*
    if (obj->HasIndexedPropertiesInExternalArrayData()) {
        pattern_data_structure_length = obj->GetIndexedPropertiesExternalArrayDataLength();
        //pattern = static_cast<double*>(obj->GetIndexedPropertiesExternalArrayData());

        pattern = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());

        //cout << "pattern_data_structure_length " << pattern_data_structure_length << endl;
        //cout << pattern[0] << endl;
        //cout << pattern[1] << endl;
        //cout << pattern[2] << endl;
        //cout << pattern[3] << endl;

        pattern_length = pattern_data_structure_length / 2;

    }

    std::vector<std::string> vector_kernel_sources;
    std::vector<cl_program> vector_programs;
    std::vector<cl_kernel> vector_kernels;
    std::map<std::string, unsigned int> map_kernel_indexes_by_name;

    unsigned int i_buffer = 0;

    std::vector<cl_mem> cl_buffers;
    std::vector<unsigned int> cl_buffer_sizes;
    std::map<std::string, unsigned int> map_buffer_indexes_by_name;

    */

    unsigned int vector_sizes = 100;

    //vector_kernel_sources = new std::vector<std::string>(vector_sizes);
    //vector_programs = new std::vector<cl_program>(vector_sizes);
    //vector_kernels = new std::vector<cl_kernel>(vector_sizes);
    //map_kernel_indexes_by_name = new std::map<std::string, unsigned int>();
    //cl_buffers = new std::vector<cl_mem>(vector_sizes);
    //map_buffer_indexes_by_name = new std::map<std::string, unsigned int>();





    localSize = 64;

    err = clGetPlatformIDs(1, &cpPlatform, NULL);
    err = clGetDeviceIDs(cpPlatform, CL_DEVICE_TYPE_GPU, 1, &device_id, NULL);
    context = clCreateContext(0, 1, &device_id, NULL, NULL, &err);
    queue = clCreateCommandQueue(context, device_id, 0, &err);

    //program = clCreateProgramWithSource(context, 1, (const char **) & kernelSource, NULL, &err);
    //clBuildProgram(program, 0, NULL, NULL, NULL, NULL);
    //kernel = clCreateKernel(program, opencl_fn_name, &err);

    cout << "Done some OpenCL init." << endl;

    //MyObject* obj = new MyObject(value);
    MyObject* obj = new MyObject();

    obj->Wrap(args.This());
    NanReturnValue(args.This());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = NanNew<Function>(constructor);
    NanReturnValue(cons->NewInstance(argc, argv));
  }
}

NAN_METHOD(MyObject::NAN_VectorAdd) {
  NanScope();
  cout << "NAN_VectorAdd" << endl;
  float* A;
  float* B;
  float* Res;
  unsigned int size;
  Local<Object> obj = args[0].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      size = obj->GetIndexedPropertiesExternalArrayDataLength();
      A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }
  obj = args[1].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }
  obj = args[2].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }
  cout << "size " << size << endl;
  //FasterVectorAdd(size, A, B, Res);

  //VecAdd(size, A, B, Res);
  NanReturnValue(NanNew(1));
}


unsigned int stored_buffer_size;


NAN_METHOD(MyObject::NAN_AddKernel) {
  NanScope();
  cout << "NAN_AddKernel" << endl;

  // Add buffer should possibly just have the name and the size.
  //  Don't want the data itself to go in?

  // Name and source.

  std::string name (*NanAsciiString(args[0]));
  std::string source (*NanAsciiString(args[1]));

  //Local<Object> obj = args[0].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    size = obj->GetIndexedPropertiesExternalArrayDataLength();
  //    A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}

  //stored_buffer_size = size;
  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //cout << "size " << size << endl;
  AddKernel(name, source);
  //cout << "post _SaveBuffer" << endl;

  NanReturnValue(NanNew(1));
}


NAN_METHOD(MyObject::NAN_AddBuffer) {
  NanScope();
  cout << "NAN_AddBuffer" << endl;

  // Add buffer should possibly just have the name and the size.
  //  Don't want the data itself to go in?

  std::string name (*NanAsciiString(args[0]));


  // double arg0 = args[0]->NumberValue();

  unsigned int size = args[1]->NumberValue();

  //std::string source (*NanAsciiString(args[1]));



  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  cout << "size " << size << endl;
  AddBuffer(name, size);
  cout << "post AddBuffer" << endl;

  NanReturnValue(NanNew(1));
}


NAN_METHOD(MyObject::NAN_SetBuffer) {
  NanScope();
  cout << "NAN_SaveBuffer" << endl;

  // Now takes the name and the buffer itself.
  //  JavaScript should have sent a buffer of the right size.
  //  Could check that.


  std::string buffer_name (*NanAsciiString(args[0]));
  cout << "save buffer_name " << buffer_name << endl;





  float* A;
  //float* B;
  //float* Res;
  unsigned int size;
  Local<Object> obj = args[1].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      size = obj->GetIndexedPropertiesExternalArrayDataLength();
      A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }



  //stored_buffer_size = size;


  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  cout << "size " << size << endl;
  SetBuffer(buffer_name, A);
  cout << "post _SaveBuffer" << endl;

  NanReturnValue(NanNew(1));
}


NAN_METHOD(MyObject::NAN_GetBuffer) {

  // This could store the buffer in the background.

  // Could make OpenCL system where a fairly small number of buffers (like 2 or 3) are stored and used.
  //  Some buffers would be more frequently reloaded.
  NanScope();


  cout << "LoadBuffer" << endl;

  std::string buffer_name (*NanAsciiString(args[0]));
  float* A;
  //float* B;
  //float* Res;
  unsigned int size;

  // Don't read the buffer in from the params. Use the stored_buffer_size.

  Local<Object> obj = args[1].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      size = obj->GetIndexedPropertiesExternalArrayDataLength();
      A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }

  GetBuffer(buffer_name, A);
  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  cout << "size " << size << endl;
  //_LoadBuffer(size, A);
  NanReturnValue(NanNew(1));



}


NAN_METHOD(MyObject::NAN_ExecuteKernel) {

  // This could store the buffer in the background.

  // Could make OpenCL system where a fairly small number of buffers (like 2 or 3) are stored and used.
  //  Some buffers would be more frequently reloaded.
  NanScope();

  std::string kernel_name (*NanAsciiString(args[1]));

  unsigned int kernel_id = map_kernel_indexes_by_name[kernel_name];


  cout << "NAN_ExecuteKernel" << endl;

  Local<Array> arr_input_buffer_names = Local<Array>::Cast(args[1]);

  //unsigned int len_input_buffer_names = (unsigned int)arr_input_buffer_names->GetIndexedPropertiesExternalArrayDataLength();
  unsigned int len_input_buffer_names = arr_input_buffer_names->Length();

  std::string output_buffer_name (*NanAsciiString(args[2]));

  cout << "len_input_buffer_names " << len_input_buffer_names << endl;
  cout << "output_buffer_name " << output_buffer_name << endl;

  // std::string tempString(*v8::String::Utf8Value(args[someInteger]));

  //v8::String::Utf8Value v8_input_buffer_name;

  std::string input_buffer_name;
  Local<String> v8_input_buffer_name;

  unsigned int output_buffer_id;

  // A vector of input buffer IDs

  std::vector<unsigned int> input_buffer_ids(len_input_buffer_names);

  unsigned int i_ibn = 0;



  //unsigned int input_buffer_ids[len_input_buffer_names];


  for (unsigned int c = 0; c < len_input_buffer_names; c++) {
    v8_input_buffer_name = arr_input_buffer_names->Get(c)->ToString();


    input_buffer_name = (*NanAsciiString(v8_input_buffer_name));
    cout << "input_buffer_name " << input_buffer_name << endl;

    input_buffer_ids[i_ibn] = map_buffer_indexes_by_name[input_buffer_name];

    cout << "input_buffer_ids[i_ibn] " << input_buffer_ids[i_ibn] << endl;

    i_ibn++;

  //  input_buffer_name = std::string(*v8_input_buffer_name);
  //  cout << "input_buffer_name " << input_buffer_name << endl;
  }

  output_buffer_id = map_buffer_indexes_by_name[output_buffer_name];

  ExecuteKernel(kernel_id, input_buffer_ids, output_buffer_id);

  //unsigned int * arr

  // Could put together integer array of the input buffers...

  // Need to assign the parameters to the kernel.
  //  Will need to get the parameters strings array.
  //  Possibly will put them into an STL Vector.

  // popencl.execute_kernel(['A', 'B', 'Res']);


    /*



  std::string buffer_name (*NanAsciiString(args[0]));
  float* A;
  //float* B;
  //float* Res;
  unsigned int size;

  // Don't read the buffer in from the params. Use the stored_buffer_size.

  Local<Object> obj = args[1].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      size = obj->GetIndexedPropertiesExternalArrayDataLength();
      A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }

  GetBuffer(buffer_name, A);
  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  cout << "size " << size << endl;
  //_LoadBuffer(size, A);
  */
  NanReturnValue(NanNew(1));



}

// NAN_ExecuteKernel



/*

NAN_METHOD(MyObject::NAN_SaveBuffer) {
  NanScope();
  cout << "NAN_SaveBuffer" << endl;

  // Now takes the name and the buffer itself.
  //  JavaScript should have sent a buffer of the right size.
  //  Could check that.


  std::string buffer_name (*NanAsciiString(args[0]));
  cout << "save buffer_name " << buffer_name << endl;




  float* A;
  //float* B;
  //float* Res;
  unsigned int size;
  Local<Object> obj = args[1].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      size = obj->GetIndexedPropertiesExternalArrayDataLength();
      A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }



  //stored_buffer_size = size;


  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  cout << "size " << size << endl;
  SaveBuffer(buffer_name, A);
  cout << "post _SaveBuffer" << endl;

  NanReturnValue(NanNew(1));
}


NAN_METHOD(MyObject::NAN_LoadBuffer) {

  // This could store the buffer in the background.

  // Could make OpenCL system where a fairly small number of buffers (like 2 or 3) are stored and used.
  //  Some buffers would be more frequently reloaded.



  NanScope();


  cout << "LoadBuffer" << endl;
  float* A;
  float* B;
  float* Res;
  unsigned int size;

  // Don't read the buffer in from the params. Use the stored_buffer_size.

  Local<Object> obj = args[0].As<Object>();
  if (obj->HasIndexedPropertiesInExternalArrayData()) {
      size = obj->GetIndexedPropertiesExternalArrayDataLength();
      A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  }

  LoadBuffer(size, A);
  //obj = args[1].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  //obj = args[2].As<Object>();
  //if (obj->HasIndexedPropertiesInExternalArrayData()) {
  //    Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());
  //}
  cout << "size " << size << endl;
  //_LoadBuffer(size, A);
  NanReturnValue(NanNew(1));



}
*/