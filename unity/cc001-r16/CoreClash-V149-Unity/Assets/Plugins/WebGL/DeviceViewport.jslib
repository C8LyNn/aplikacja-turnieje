mergeInto(LibraryManager.library, {
  CcTouchCapable: function () { return window.CoreClashViewport && window.CoreClashViewport.touch() ? 1 : 0; },
  CcSafeInsetLeft: function () { return window.CoreClashViewport ? window.CoreClashViewport.inset('left') : 0; },
  CcSafeInsetTop: function () { return window.CoreClashViewport ? window.CoreClashViewport.inset('top') : 0; },
  CcSafeInsetRight: function () { return window.CoreClashViewport ? window.CoreClashViewport.inset('right') : 0; },
  CcSafeInsetBottom: function () { return window.CoreClashViewport ? window.CoreClashViewport.inset('bottom') : 0; }
});
