#include "pocl.h"
using namespace v8;

Persistent<Function> POpenCL::constructor;

/*
POpenCL::POpenCL(double value) : value_(value) {
}
*/

POpenCL::~POpenCL() {
}

void POpenCL::Init(Handle<Object> exports) {
  NanScope();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = NanNew<FunctionTemplate>(New);
  tpl->SetClassName(NanNew("POpenCL"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  //NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  NanAssignPersistent(constructor, tpl->GetFunction());
  exports->Set(NanNew("POpenCL"), tpl->GetFunction());
}



NAN_METHOD(POpenCL::New) {
  NanScope();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    //double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();

    POpenCL* obj = new POpenCL(value);
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

/*
NAN_METHOD(POpenCL::PlusOne) {
  NanScope();

  POpenCL* obj = ObjectWrap::Unwrap<POpenCL>(args.Holder());
  obj->value_ += 1;

  NanReturnValue(NanNew(obj->value_));
}
*/

/*
NAN_INDEX_SETTER(CVector::IndexedSet) {
    NanScope();



    NanReturnNull();
}
*/

/*

NAN_METHOD(CVector::IndexedSet) {
  NanScope();

  //CVector* obj = ObjectWrap::Unwrap<CVector>(args.Holder());
  //obj->value_ += 1;

  //NanReturnValue(NanNew(obj->value_));

  NanReturnNull();
}
*/