#ifndef POPENCL_H
#define POPENCL_H

#include <nan.h>

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Handle<v8::Object> exports);

 private:
  //explicit MyObject(double value = 0);
  ~MyObject();

  static NAN_METHOD(New);

  //static NAN_METHOD(NAN_VectorAdd);

  static NAN_METHOD(NAN_AddBuffer);
  static NAN_METHOD(NAN_AddKernel);
  static NAN_METHOD(NAN_SetBuffer);
  static NAN_METHOD(NAN_GetBuffer);
  static NAN_METHOD(NAN_GetBufferSize);
  static NAN_METHOD(NAN_ExecuteKernel);
  static NAN_METHOD(NAN_ExecuteKernelAllSizeParams);
  static NAN_METHOD(NAN_ReleaseAll);
  static NAN_METHOD(NAN_ReleaseBuffer);
  //static NAN_METHOD(NAN_SaveBuffer);
  //static NAN_METHOD(NAN_LoadBuffer);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

#endif
