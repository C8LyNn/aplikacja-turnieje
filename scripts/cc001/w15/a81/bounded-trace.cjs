'use strict';
/** Bounded A81 1-Hz trace intake. Never silently truncate evidence. */
const MAX_MARKERS = 20000;
const MAX_ERRORS = 100;
class BoundedTrace {
  constructor(maxMarkers=MAX_MARKERS,maxErrors=MAX_ERRORS) {
    if(!Number.isSafeInteger(maxMarkers)||maxMarkers<1||!Number.isSafeInteger(maxErrors)||maxErrors<1)
      throw new Error('Positive marker/error caps required');
    this.maxMarkers=maxMarkers;this.maxErrors=maxErrors;
    this.records=[];this.errors=[];this.omittedMarkers=0;this.omittedErrors=0;
  }
  admit(line){
    if(this.records.length>=this.maxMarkers || this._accepted>=this.maxMarkers){
      this.omittedMarkers++;
      if(this.omittedMarkers===1)this.error({code:'TRACE_MARKER_LIMIT_EXCEEDED',line});
      return false;
    }
    this._accepted=(this._accepted||0)+1;
    return true;
  }
  error(item){
    if(this.errors.length<this.maxErrors)this.errors.push(item);
    else this.omittedErrors++;
  }
  record(item){this.records.push(item);}
  summary(){return {omittedMarkers:this.omittedMarkers,omittedErrors:this.omittedErrors};}
}
module.exports={BoundedTrace,MAX_MARKERS,MAX_ERRORS};
