#ifndef POCL_H
#define POCL_H

#include <nan.h>

class POpenCL : public node::ObjectWrap {
 public:
  static void Init(v8::Handle<v8::Object> exports);

 private:
  explicit POpenCL();
  ~POpenCL();

  static NAN_METHOD(New);
  //static NAN_METHOD(PlusOne);
  //static NAN_INDEX_SETTER(IndexedSet);
  //static NAN_INDEX_SETTER
  static v8::Persistent<v8::Function> constructor;
  //double value_;
};

#endif