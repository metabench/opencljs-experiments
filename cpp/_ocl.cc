//#ifndef STDSTRING_H
//#define STDSTRING_H

//#include <string>
#include <string>
//#include <cstdlib>
#include <node.h>
#include <v8.h>
#include <iostream>
#include <stdlib.h>
#include <nan.h>
#include <math.h>

#include "pocl.h"
//#include "cl\opencl.h"

//using namespace v8;
using namespace node;
using namespace std;

using v8::FunctionTemplate;
using v8::Handle;
using v8::Object;
using v8::String;
using v8::Number;
using v8::Local;
using v8::Value;
using v8::Array;

//using CL::clGetPlatformIDs;

#include <CL/cl.h>
// Want to enumerate the devices.
//  Probably better as a nanmethod, so we can put it into data structues....


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

// Could we initialize the kernel and opencl device when it loads?

cl_platform_id cpPlatform;        // OpenCL platform
cl_device_id device_id;           // device ID
cl_context context;               // context


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
    cl_mem d_a;
    cl_mem d_b;
    // Device output buffer
    cl_mem d_c;


    cl_command_queue queue;           // command queue
    cl_program program;               // program
    cl_kernel kernel;                 // kernel

    // Size, in bytes, of each vector
    size_t bytes = size*sizeof(float);

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

    // Maybe we should try taking in some JavaScript typed arrays



    //for( i = 0; i < n; i++ )
    //{
        //h_a[i] = sinf(i)*sinf(i);
        //h_b[i] = cosf(i)*cosf(i);

    //    h_a[i] = i;
    //    h_b[i] = i - 5;
    //}

    size_t globalSize, localSize;
    cl_int err;

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


void ShowDevices() {

	unsigned int i, j;
	char* value;
	size_t valueSize;
	cl_uint platformCount;
	cl_platform_id* platforms;
	cl_uint deviceCount;
	cl_device_id* devices;
	cl_uint maxComputeUnits;

	// get all platforms
	clGetPlatformIDs(0, NULL, &platformCount);
	platforms = (cl_platform_id*)malloc(sizeof(cl_platform_id) * platformCount);
	clGetPlatformIDs(platformCount, platforms, NULL);

	for (i = 0; i < platformCount; i++) {

	    cout << "PLATFORM" << endl;

		// get all devices
		clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_ALL, 0, NULL, &deviceCount);
		devices = (cl_device_id*)malloc(sizeof(cl_device_id) * deviceCount);
		clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_ALL, deviceCount, devices, NULL);

		// for each device print critical attributes
		for (j = 0; j < deviceCount; j++) {

			// print device name
			clGetDeviceInfo(devices[j], CL_DEVICE_NAME, 0, NULL, &valueSize);
			value = (char*)malloc(valueSize);
			clGetDeviceInfo(devices[j], CL_DEVICE_NAME, valueSize, value, NULL);
			printf("%d. Device: %s", j + 1, value);
			cout << endl;

			free(value);

			// print hardware device version
			clGetDeviceInfo(devices[j], CL_DEVICE_VERSION, 0, NULL, &valueSize);
			value = (char*)malloc(valueSize);
			clGetDeviceInfo(devices[j], CL_DEVICE_VERSION, valueSize, value, NULL);
			printf(" %d.%d Hardware version: %s", j + 1, 1, value);
			cout << endl;
			free(value);

			// print software driver version
			clGetDeviceInfo(devices[j], CL_DRIVER_VERSION, 0, NULL, &valueSize);
			value = (char*)malloc(valueSize);
			clGetDeviceInfo(devices[j], CL_DRIVER_VERSION, valueSize, value, NULL);
			printf(" %d.%d Software version: %s", j + 1, 2, value);
			cout << endl;
			free(value);

			// print c version supported by compiler for device
			clGetDeviceInfo(devices[j], CL_DEVICE_OPENCL_C_VERSION, 0, NULL, &valueSize);
			value = (char*)malloc(valueSize);
			clGetDeviceInfo(devices[j], CL_DEVICE_OPENCL_C_VERSION, valueSize, value, NULL);
			printf(" %d.%d OpenCL C version: %s", j + 1, 3, value);
			cout << endl;
			free(value);

			// print parallel compute units
			clGetDeviceInfo(devices[j], CL_DEVICE_MAX_COMPUTE_UNITS,
				sizeof(maxComputeUnits), &maxComputeUnits, NULL);
			printf(" %d.%d Parallel compute units: %d", j + 1, 4, maxComputeUnits);
			cout << endl;

		}

		free(devices);

	}

	free(platforms);
	//system("pause");
	//return 0;

}

// Not so sure how to return a C++ nested object... but now I think this will return an array anyway.

NAN_METHOD(NAN_VecAdd) {
// get_occurrances_info_from_time_series_ita
    NanScope();

    float* A;
    float* B;
    float* Res;

    unsigned int size;

    Local<Object> obj = args[0].As<Object>();
    if (obj->HasIndexedPropertiesInExternalArrayData()) {
        size = obj->GetIndexedPropertiesExternalArrayDataLength();
        //pattern = static_cast<double*>(obj->GetIndexedPropertiesExternalArrayData());

        A = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());


        //cout << pattern[0] << endl;
        //cout << pattern[1] << endl;
        //cout << pattern[2] << endl;
        //cout << pattern[3] << endl;

        //pattern_length = pattern_data_structure_length / 2;

    }

    //cout << "post load  " << endl;


    obj = args[1].As<Object>();
    if (obj->HasIndexedPropertiesInExternalArrayData()) {
        //time_series_length = obj->GetIndexedPropertiesExternalArrayDataLength();
        //time_series = static_cast<double*>(obj->GetIndexedPropertiesExternalArrayData());

        B = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());

        //cout << "time_series_length " << time_series_length << endl;
        //cout << pattern[0] << endl;
        //cout << pattern[1] << endl;
        //cout << pattern[2] << endl;
        //cout << pattern[3] << endl;

        //int pattern_length = pattern_data_structure_length / 2;


    }

    obj = args[2].As<Object>();
    if (obj->HasIndexedPropertiesInExternalArrayData()) {
        //time_series_length = obj->GetIndexedPropertiesExternalArrayDataLength();
        //time_series = static_cast<double*>(obj->GetIndexedPropertiesExternalArrayData());

        Res = static_cast<float*>(obj->GetIndexedPropertiesExternalArrayData());

        //cout << "time_series_length " << time_series_length << endl;
        //cout << pattern[0] << endl;
        //cout << pattern[1] << endl;
        //cout << pattern[2] << endl;
        //cout << pattern[3] << endl;

        //int pattern_length = pattern_data_structure_length / 2;


    }

    //cout << "size " << size << endl;

    VecAdd(size, A, B, Res);
}

NAN_METHOD(LogOpenCLInfo) {
// get_occurrances_info_from_time_series_ita
    NanScope();

    ShowDevices();

}


void init(Handle<Object> exports) {
    //NODE_SET_METHOD(exports, "get_occurrances_info_from_time_series_ita", GetOccurrancesInfoFromTimeSeriesIta);

    //exports->Set(NanNew<String>("add"), NanNew<FunctionTemplate>(Add)->GetFunction());
    //exports->Set(NanNew<String>("add_to_all"), NanNew<FunctionTemplate>(AddToAll)->GetFunction());
    //exports->Set(NanNew<String>("total"), NanNew<FunctionTemplate>(Total)->GetFunction());
    //exports->Set(NanNew<String>("get_occurrences_info_from_time_series_ita"), NanNew<FunctionTemplate>(GetOccurrencesInfoFromTimeSeriesIta)->GetFunction());
    //exports->Set(NanNew<String>("log_opencl_info"), NanNew<FunctionTemplate>(LogOpenCLInfo)->GetFunction());
    //exports->Set(NanNew<String>("vec_add"), NanNew<FunctionTemplate>(NAN_VecAdd)->GetFunction());

    //exports->Set(NanNew<String>("POpenCL"), POpenCL::POpenCL);

    POpenCL::Init(exports);

}

NODE_MODULE(addon, init)