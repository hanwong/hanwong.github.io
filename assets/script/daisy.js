d3.selection.prototype.daisyModule = function() {
  return this.node().__daisyModule__;
};
d3.selection.prototype.container = function(_container) {
  if(!arguments.length) {
    return d3.select(this.node().__daisyContainer__);
  }
  else {
    this.node().__daisyContainer__ = _container.node();
    return this;
  }
};
d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
d3.selection.prototype.innerSize = function(w) {
  if(!arguments.length) return this.node().__daisyInnerSize__;
  this.node().__daisyInnerSize__ = w;
  return this;
};
//locale 설정

d3.daisy = {};
d3.daisy.default = {};
d3.daisy.default.font =function() {
  return {'fontFamily' : 'sans-serif',
  'fontSize' : 12,
  'fontWeight' : 'normal',
  'fontStyle' : 'normal'};
};
d3.daisy.default.schemeCategory10 = function() {
  return d3.schemeCategory10;
};
d3.daisy.default.schemeCategory20 = function() {
  return d3.schemeCategory20;
};

d3.daisy.default.schemeLinear2 = function() {
  return ['#c5d3e6', '#4682b4'];
};
d3.daisy.default.locale = function(locale) { //locale 설정
  locale = locale || 'ko-KR';
  var timeFormats = {
    'ko-KR' : {
      "dateTime": "%Y/%m/%d %a %X",
      "date": "%Y/%m/%d",
      "time": "%H:%M:%S",
      "periods": ["오전", "오후"],
      "days": ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
      "shortDays": ["일", "월", "화", "수", "목", "금", "토"],
      "months": ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
      "shortMonths": ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]
    }
  };
  var formats = {
    'ko-KR' : {
    "decimal": ".",
    "thousands": ",",
    "grouping": [3],
    "currency": ["₩", ""]
    }
  };
  d3.timeFormatDefaultLocale(timeFormats[locale]);

  d3.formatDefaultLocale(formats[locale]);
};
d3.daisy.default.locale();

d3.daisy.layer = function() {
  var container, name;
  var layers = [];
  var exports = {};
  var defaultEvents = ['click', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup'];
  var listeners = d3.dispatch.apply(this,defaultEvents);

  function _setEventEmitter(_selection, condition, on) {
    if(on) {
      _selection.on(condition, function(d) {
          listeners.call(condition, this, d); //selection 자체와 datum을 전달
      });
    }
    return _selection;
  }

  exports.container = function(_container) { //container DOM 셀렉션을 바로 받은 경우;
    if(!arguments.length) return container;
    if(typeof _container === 'string') {
      _container = d3.select(_container); //FIXME : 알고리즘 수정/ 상위 노드에 container있을때는 상위에서 찾도록
    }
    container = _container;
    return exports;
  };
  exports.layer = function(l) {
    if(arguments.length) {
      layers.push({container:container.node(), layer:l}); // layer를 등록
      return exports;
    }
    var layer = layers.filter(function(d) {
      return d.container === container.node();
    });
    if(layers.length === 0 || layer.length === 0 ) {
      layer = container.append('g')
        .attr('class', 'layer')
        .call(exports.setDaisyModule); //daisy module을 연결
      layers.push({container:container.node(), layer:layer}); // mark 설정에 layer가 다양할 수 있으므로 container마다 layer를 구분할 수 있도록 설정
      return layer;
    } else {
      return layer[0].layer;
    }
  };

  exports.setDaisyModule = function(_selection) {
    _selection.each(function() {
      this.__daisyModule__ = exports;
    });
    return _selection;
  };
  exports.setEventEmitters = function(_selection,conditions) {
    for (var c in conditions) {
      if(conditions.hasOwnProperty(c)) {
        _selection.call(_setEventEmitter, c, conditions[c]);

      }
    }
    return _selection;
  };
  exports.setContainer = function(_selection) {

    _selection.each(function() {
      d3.select(this).container(container);
    });

    return _selection;
  };
  exports.defaultEvents = function() {
    return defaultEvents;
  };
  exports.render = function() {};
  exports.listeners = function() {
    return listeners;
  };
  exports.name = function(_name) {
    if(!arguments.length) return name;
    name = _name;
    return exports;
  };
  d3.daisy.utils.rebindOnMethod(exports, listeners);
  return exports;
};

d3.daisy.utils = {
 rebindOnMethod : function(instance, listeners) {
   instance.on = function() {
     var value = listeners.on.apply(listeners, arguments);
     return value === listeners ? instance : value;
   };
 },
 setAttrDefaultFuncs : function(instance, attrs) {
   var _defaultAttrFunc = function(attr) {
     return function(_val) {
       if(!arguments.length) return attrs[attr];
       attrs[attr] = _val;
       return instance;
     };
   };
   for (var attr in attrs) {
     if(attrs.hasOwnProperty(attr) && !instance[attr]) {
        instance[attr] = _defaultAttrFunc(attr);
       }
    }}
};

d3.daisy.scale = function(type) {
  var types = ['linear', 'log', 'time', 'ordinal', 'point', 'band'];
  var attrs = {
    type:null,
    domain:[1,0],
    range:[1,0],
    reverse: false, //reverse scale range
    round: false,
    padding : 0, //[0,1]
    paddingInner : 0,
    paddingOuter : 0,
    clamp: false
  };
  attrs.type = type || 'linear';

  var scale, frame;
  var fromFrame = false;
  var exports = function(val) {
    if(!scale) _scale();
    else {
      if (fromFrame) _range();
      return scale(val);
    }
  };
  function _update() {
     _scale();
    _domain();
    _range();
    _padding();
    _clamp();
  }
 function _domain() {
   scale.domain(attrs.domain);
 }
 function _range() {
   var range = attrs.range;
   if(fromFrame) {
     var newRange = [];
     range.forEach(function(e) {
       if(typeof e === 'string') {
         if(e ==='width') {
           newRange.push(frame.innerWidth());
         } else if(e ==='height') {
           newRange.push(frame.innerHeight());
         } else {
           newRange.push(e);
         }
       } else {
         newRange.push(e);
       }
     });
     range = newRange;
   }
   if(attrs.round) scale.rangeRound(range);
   else scale.range(range);
 }
 function _reverse() {
   if(attrs.reverse) attrs.range = attrs.range.reverse();
   _range();
 }
 function _padding() {
   if(attrs.type === 'point' || attrs.type === 'band') {
     if(attrs.padding) scale.padding(attrs.padding);
     if(attrs.paddingInner) scale.paddingInner(attrs.paddingInner);
     if(attrs.paddingOuter) scale.paddingOuter(attrs.paddingOuter);
   }
 }
 function _clamp() {
   var isContinous = (attrs.type === 'time' || attrs.type === 'linear' || attrs.type === 'log');
   if(attrs.clamp && isContinous) sclae.clamp(true);
 }
 function _nice() {
   var isContinous = (attrs.type === 'time' || attrs.type === 'linear' || attrs.type === 'log');
   if(attrs.nice && isContinous) { //time 일 경우는 일자 단위  | 나머지는 소수점 자리 log의 경우 인자없이 true만
     if(attrs.type==='log') scale.nice();
     else scale.nice(attrs.nice);
   }
 }
 function _scale() {
   if(attrs.type==='ordinal') {//return scale;
     scale = d3.scaleOrdinal();
   } else if(attrs.type==='linear'){
     scale = d3.scaleLinear();
   } else if(attrs.type==='log'){
     scale = d3.scaleLog();
   } else if(attrs.type==='time') {
     scale = d3.scaleTime(); //time to number
   } else if(attrs.type==='point') {
     scale = d3.scalePoint();
   } else if(attrs.type==='band') {
     scale = d3.scaleBand();
   } else {
     //TODO : emit an error;
   }
 }
 exports.domain = function(extent) {
   if(!arguments.length) {
     return attrs.domain;
   }
   else {
     attrs.domain = extent;
     _domain();
     return exports;
   }
 };
 exports.range = function(extent) {
   if(!arguments.length) {
     return scale.range();
   }
   else {
     attrs.range = extent;
     fromFrame = false;
     _range();
     return exports;
   }
 };
 exports.rangeFromFrame = function(extent, f) {
   attrs.range = extent;
   frame = f;
   fromFrame = true;
   _range();
   return exports;
 };
 exports.frame = function(f) {
   frame = f;
   return exports;
 };
 exports.reverse = function(val) {
   if(!arguments.length) return attrs.reverse;
   else {
     attrs.reverse = val;
     _reverse();
     return exports;
   }
 };
 exports.round = function(val) {
   if(!arguments.length) return attrs.round;
   else {
     attrs.round = val;
     _range();
     return exports;
   }
 };
 exports.padding = function(val) {
   if(!arguments.length) return attrs.padding;
   else {
     attrs.padding = val;
     _padding();
     return exports;
   }
 };
 exports.paddingInner = function(val) {
   if(!arguments.length) return attrs.padding;
   else {
     attrs.paddingInner = val;
     _padding();
     return exports;
   }
 };
 exports.paddingOuter = function(val) {
   if(!arguments.length) return attrs.padding;
   else {
     attrs.paddingOuter = val;
     _padding();
     return exports;
   }
 };
 exports.clamp = function(val) {
   if(!arguments.length) return attrs.clamp;
   else {
     attrs.clamp = val;
     _clamp();
     return exports;
   }
 };
 exports.nice = function(val) {
   if(!arguments.length) return attrs.nice;
   else {
     attrs.nice = val;
     _nice();
     return exports;
   }
 };

 exports.type = function(_type) {
   if(!arguments.length) {
     return attrs.type;
   } else {
     attrs.type = _type;
     _scale();
     return exports;
   }
 };
 exports.bandwidth = function() {
   if(attrs.type === 'band') return scale.bandwidth();
   else {
     return NaN;
   }
 };
 exports.step = function() {
   if(attrs.type === 'point') return scale.step();
   else {
     return NaN;
   }
 };
 exports.scale = function() {
   _range();
   return scale;
 };
 d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
 return exports;
};

d3.daisy.transformMethods =  function(){ //TODO : nest 하고 key 값 요소 살려두기
  function _compare(a, b, order, orderList) {
    function __compareNumbers(a,b) {
      if(order === 'ascending')return a-b;
      else return b-a;
    }
    function __compareStrings(a,b) {
      if(order==='ascending') return a.localeCompare(b);
      else return b.localeCompare(a);
    }
    function __compareByList(a,b) {
      var ai = orderList.indexOf(a), bi = orderList.indexOf(b);
      if(order === 'ascending') return ai - bi;
      else return bi-ai;
    }
    order = order || 'ascending';
    var compareFunc;
    if(!orderList || orderList.length === 0) {
      compareFunc = (typeof a === 'string' ? __compareStrings : __compareNumbers );
    }
    else {
      compareFunc = __compareByList;
    }
    return  compareFunc(a,b);
  }
  function _compareSequentially(a,b,orderby, order) {//orderby는 Array
    order = order || 'ascending';
    var i;
    for (i = 0; i < orderby.length ; i++) {
      var diff = _compare(a[orderby[i]],b[orderby[i]], order);
      if (diff !== 0 ) return diff;
    }
    return 0;
  }

  function _summarizeWithField(op) {
    return function(leaves, field) {
      if(field) return d3[op](leaves, function(d){return d[field];});
      else return d3[op](leaves);
    };
  }
  var summarizeOps = {};
  summarizeOps.values = function(leaves) {
    return leaves;
  };
  summarizeOps.count = function(leaves) {
    return leaves.length;
  };
  var opsWithField = ['sum', 'mean', 'variance', 'min', 'max', 'median', 'deviance', 'extent'];
  opsWithField.forEach(function(op) {
    summarizeOps[op] = _summarizeWithField(op);
  });

  function _concatGroupby(d, groupby, delimiter) {
    delimiter  = delimiter || '___';
    if(groupby.length ==1) return d[groupby[0]];
    return groupby.map(function(k){
      return d[k];
    }).join(delimiter);
  }
  function _splitKeys(target, keys, types, delimiter) {
    target.map(function(d) {
      var keyVals = d.key.split(delimiter);
      if(Array.isArray(keys)) keyVals = d3.zip(keys, keyVals);
      else keyVals = d3.zip([keys], keyVals);
      keyVals.forEach(function(k) { //k[0]== key, k[1]==val;
        var key = k[0], val= k[1];
        if(key!== 'key' && key !== 'values') {
          var type = types.get(key);
          var value = val;
          if(type === 'date') value = new Date(value);
          else if(type === 'number') value = +value;
          d[key] = value;
        }
      });
    });
    return target;
  }
  function _type(target, groupby) {
    var isNumber = false,
      isDate=false;
    var d = target[0][groupby];
    if(Object.prototype.toString.call(d) === '[object Date]') {
      return 'date';
    } else if(typeof d === 'number' || (!isNaN(d) && (+d.toString() === d ))) { // || !isNaN(d)
      return 'number';
    } else  {
      return 'string';
    }
  }

  //TODO : summarize 방법 추가argmax-min, quantile
  var exports = {};
  /******
  Data Manipulation Transforms
  ******/
  exports.set = function(target, options) {
    var field = options.field;
    var values = [];
    target.forEach(function(d) {
      var v;
      if(Array.isArray(field)) {
        v = _concatGroupby(d, field);
      } else {
        v = d[field];
      }
      if(values.indexOf(v) <0) {
        values.push(v);
      }
    });
    return values;
  };
  exports.field = function(target, options) { //TODO : 특정 필드만 선택 가능하도록
    var fields = options.field;
    if(Array.isArray(fields)) {

    }
  };
  exports.filter  = function(target, options) {
    var condition = options.condition;
    //condition : function(d) {return 'd.x > 10;'}
    return Array.prototype.filter.apply(target, condition);
  };

  exports.nest = function(target, options) {
    //TODO: group별로 aggregate나 개별 transform 이 가능하도록 추가
    var groupby = options.groupby,
      summarize = options.summarize;
    var nest = d3.nest();
    if(Array.isArray(groupby)) {
      groupby.forEach(function(k) {
        nest.key(function(d){return d[k];});
      });
    } else {
      nest.key(function(d){return d[groupby];});
    }
    return nest.entries(target);
  };
  exports.facet = function(target, options) {
    var groupby = options.groupby,
    delimiter = options.delimiter || '___',
    flatten = options.flatten === false ? false : true ; //default true
    keyComparator = options.keyComparator || d3.ascending; //키는 기본적으로 ascending 순
    var nest = d3.nest();
    var groupbyTypes = d3.map();
    if(!Array.isArray(groupby)) {
      groupby = [groupby];
    }
    groupby.forEach(function(g) {
      groupbyTypes.set(g, _type(target, g));
    });
    if(flatten) { //flatten 인 경우 모두 납작하게
      nest.key(function(d){
        var k = _concatGroupby(d,groupby, delimiter);
        return k;
      }).sortKeys(keyComparator);
    } else {
      groupby.forEach(function(k) {
        nest.key(function(d){return d[k];})
          .sortKeys(keyComparator);
      });
    }

    var result = nest.entries(target);

    if(flatten) {
      result = _splitKeys(result, groupby, groupbyTypes, delimiter);
    }

    return result;
  };

  exports.aggregate = function(target, options) {
    //groupby : 그룹을 만들 키가 되는 필드 스트링 배열
    //summarize : 요약할 필드와 방법들의 배열 [{field:'field', 'op':operattor}]
    var summarize = options.summarize,
     groupby = options.groupby,
     flatten = options.flatten === false ? false : true , //default는 true, true일 경우 key가 concat된 형태이며 value도 동일한 오브젝트에 모두 표시
     delimiter = options.delimiter || '___',
     keyComparator = options.keyComparator || d3.ascending;
    var nest = d3.nest();
    var groupbyTypes = d3.map();
    var _rollup = function(leaves, s) {
      return summarizeOps[s.op](leaves, s.field);
    };
    var _rollupAll = function(leaves, summarize) {
      var result = {};
      var __field = function(s) {
        var field;
        if(s.as) {
          field = s.as;
        } else if(opsWithField.indexOf(s.op) >= 0) {
          field = s.field + '_' + s.op;
        } else {
          field = s.op;
        }
        return field;
      };
      if(Array.isArray(summarize)) { //array 인 경우
        summarize.forEach(function(s) {
          var field = __field(s);
          result[field] = _rollup(leaves, s);
        });
      } else { //object만 들어온 경우
        var field= __field(summarize);
        result[field] = _rollup(leaves, summarize);
      }
      return result;
    };

    if(!groupby) {
      return _rollupAll(target, summarize);
    } else if(!Array.isArray(groupby)) {
      groupby = [groupby];
    }
    groupby.forEach(function(d) {
      groupbyTypes.set(d, _type(target, d));
    });
    if(flatten) { //flatten 인 경우 모두 납작하게
      nest.key(function(d){
        return _concatGroupby(d,groupby, delimiter);
      }).sortKeys(keyComparator);
    } else {
      groupby.forEach(function(k) {
        nest = nest.key(function(d){return d[k];}).sortKeys(keyComparator);
      });
    }


    nest.rollup(function(leaves){
      //FIXME: 집산된 결과 값의 필드를 사용자가 지정할 수 잇도록 변경?
      return _rollupAll(leaves, summarize);
    });

    var result = nest.entries(target); //{key: , value:}
    var _merge = function(result) {
      var merged = result.map(function(d) {
        var nr = {};
        for (var k in d.value) {
          if(d.value.hasOwnProperty(k)) {
            nr[k] = d.value[k];
          }
        }
        nr.key = d.key;
        return nr;
      });

      return merged;
    };
    if(flatten) {
      result = _merge(result);
      result = _splitKeys(result, groupby, groupbyTypes, delimiter);
      //FIXME : key에 의해 순서 조정
      exports.sort(result, {orderby:groupby});
      return result;
    }
    else return result;
  };

  exports.sort = function(target, options) {
    // orderby : string | list
    // order : 'ascending' | 'descending';
    options = options || {};
    var orderby = options.orderby,
    order = options.order || 'ascending',
    orderList = options.orderList;
    target.sort(function(a,b){
      if(!orderby){
        return _compare(a,b, order, orderList);
      } else if(Array.isArray(orderby)) {
        return _compareSequentially(a,b,orderby, order, orderList);
      } else { //string
        return _compare(a[orderby], b[orderby], order, orderList);
      }
    });
    return target;
  };

  /******
  Visual Encoding Transforms
  ******/
  //TODO : 반환 형태 통일 {start, end middle } 같은 형식
  exports.pie = function(target, options) { // pie 형태 데이터 생성에 사용
    /*example
    var data = [
      {"number":  4, "name": Locke},
      {"number":  8, "name": Reyes},
      ...
    ];
    */
    //d3-shape : d3.pie()
    //options : field(required), startAngle, endAngle, sort
    //return : {"data":1, "value" : 1, startAngle": 6.050474740247008, "endAngle": 6.166830023713296, "padAngle": 0},
    //FIXME: 결과값에 midAngle 추가
    var field = options.field,
      startAngle = options.startAngle || 0;
      endAngle = options.endAngle || 2 * Math.PI,
      order = options.order || null;

    var pie = d3.pie();
    pie = pie.value(function(d){return d[options.field];})
      .startAngle(startAngle)
      .endAngle(endAngle);
    if(!order) pie.sortValues(null);
    else if(order === 'descending') pie.sortValues(function(a,b) {
      return b-a;
    });
    var flatten = pie(target).map(function(d) {
      var out = d.data;
      out.layout_start = d.startAngle;
      out.layout_middle = (d.endAngle + d.startAngle) * 0.5;
      out.layout_end = d.endAngle;
    //  out.layout_pad = d.padAngle;
      return out;
    });
    return flatten;
  };
  exports.stack = function(target, options) { //stacked 형태 데이터 만들때 사용
    //FIXME : orderby를 단일 필드로 수정
    /*example
    {"type": "stack", "groupby": ["x"], "orderby": ["c"], "field": "y"}

    [{"x": 0, "y": 28, "c":0}, {"x": 0, "y": 55, "c":1},
     {"x": 1, "y": 91, "c":1}, {"x": 1, "y": 91, "c":1},...]
    */
    //d3-shape : d3.stack()
    //options : orderby(required) x축 방향, field y축 방향, [groupby] grouping, offset
    //return : 입력과 동일한 오브젝트에 start, end 추가
    var groupby = options.groupby,
     orderby = options.orderby,
     field = options.field,
     //offset = options.offset || 'zero', TODO : offset 추가
     delimiter = options.delimiter || '___' ;

    var facet = exports.facet(target, {groupby:groupby, flatten:true});
    var valuesLen = facet[0].values.length;
    facet.forEach(function(d, i) {
      d.values = exports.sort(d.values, {orderby:orderby});
      if(valuesLen !== d.values.length) {
        return ; //TODO : 개수가 맞지 않으므로 에러
      }
    });
    var facetLen = facet.length;
    var curIndex = 0;
    var result = [];
    var _accumulate = function(curIndex) {
      var __lastVal = function(d,i,facetIndex) {
        var lastValues = facet[facetIndex-1].values;
        var lastVal = lastValues[i];

        if(d[field] > 0) {
          d.layout_end = lastVal.layout_start ;
          d.layout_start = d.layout_end + d[field];
        } else {
          d.layout_start = lastVal.layout_end ;
          d.layout_end = d.layout_start + d[field];
        }
      };
      var curValues = facet[curIndex].values;
      //layout_start가 더 크다.
      if(curIndex === 0) {
        curValues.forEach(function(d) {
          if (d[field] >= 0 ) {
            d.layout_end = 0;
            d.layout_start = d[field];
          } else {
            d.layout_end = d[field];
            d.layout_start = 0;
          }
        });
      } else {
        curValues.forEach(function(d,i) {
          __lastVal(d,i,curIndex);
        });
      }
    };
    while(curIndex < facetLen) {
      _accumulate(curIndex);
      curIndex += 1;
    }
    var flatten = facet.reduce(function(pre, cur) {
      cur.values.forEach(function(d) {
        delete d._temp_val_;
      });
      return pre.concat(cur.values);
    }, []);

    return flatten;
  };
  exports.treemap = function(target, options) { //참조 : https://bl.ocks.org/mbostock/2838bf53e0e65f369f476afd653663a2, http://bl.ocks.org/mbostock/f85ffb3a5ac518598043
    //입력 데이터가 이미 위계적인 구조 여야함
    //d3-hierachy: d3.treemap
    //options : field(required) : 크기 값, padding, ratio, round, size[width,height](required), children:children array 담고 있는 필드, sortby
    /*
    node.x0 - the left edge of the rectangle
    node.y0 - the top edge of the rectangle
    node.x1 - the right edge of the rectangle
    node.y1 - the bottom edge of the rectangle
    */
    var children = options.children || 'values',
      field = options.field,
      orderby = options.orderby,
      size = options.size || [800, 600],
      padding = options.padding || 0,
      paddingTop = options.paddingTop || 0,
      paddingLeft = options.paddingLeft || 0,
      paddingRight = options.paddingRight || 0,
      paddingBottom = options.paddingBottom || 0,
      flatten = options.flatten,
      isRoot = options.isRoot;
    var nestedTarget = {};
    if(isRoot) nestedTarget = target;
    else nestedTarget[children] = target;

    var root = d3.hierarchy(nestedTarget, function(d){return d[children];}); //d3.hierarchy node를 생성해서 전달
    root = root.sum(function(d){return d[field];}); //treemap 실행시에 반드시 불러줘야함
    if(orderby) root = root.sort(function(a, b) { return _compareSequentially(a,b,orderby); });
    var treemap = d3.treemap().size(size);
    if(options.round) treemap.round(options.round);
    if(padding) treemap.padding(padding);
    if(paddingTop) treemap.paddingTop(paddingTop);
    if(paddingLeft) treemap.paddingLeft(paddingLeft);
    if(paddingRight) treemap.paddingRight(paddingRight);
    if(paddingBottom) treemap.paddingBottom(paddingBottom);
    var result = treemap(root);
    if(flatten) result = result.descendants();
    if(!isRoot && !flatten) result = result.children; // depth 1부터 시작
    return result;
  };
  exports.pack = function(target, options) { //TODO : 버블 형태의 트리맵 위해
    //d3-hierarchy
    var children = options.children || 'values',
      field = options.field,
      orderby = options.orderby,
      size = options.size || [800, 600],
      padding = options.padding || 0,
      flatten = options.flatten,
      isRoot = options.isRoot;
    var nestedTarget = {};
    if(isRoot) nestedTarget = target;
    else nestedTarget[children] = target;

    var root = d3.hierarchy(nestedTarget, function(d){return d[children];}); //d3.hierarchy node를 생성해서 전달
    root = root.sum(function(d){return d[field];}); //treemap 실행시에 반드시 불러줘야함
    if(orderby) root = root.sort(function(a, b) { return _compareSequentially(a,b,orderby); });
    var pack = d3.pack().size(size);
    if(padding) pack.padding(padding);

    var result = pack(root);
    if(flatten) result = result.descendants();
    if(!isRoot && !flatten) result = result.children; // depth 1부터 시작
    return result;
  };
  exports.melt = function(target, options) { //unpivot에 사용
    var groupby = options.groupby; //array 형태 , 고정된  field들
    var field = options.field;//array 형태, unpivot될 field들
    if(!Array.isArray(field)) return target;
    var result = target.map(function(d) {
      return field.map(function(m) {
        var o = {};
        groupby.forEach(function(g) {
          o[g] = d[g];
        });
        o.__melted_key__ = m;
        o.__melted_value__ = d[m];
        return o;
      });
    });
    return d3.merge(result);
  };
  exports.parCoords = function(target, options) {
    var groupby = options.groupby,
    scale = options.scale,
    prefix = options.prefix || 'scale_y_';
    if(!Array.isArray(groupby)) groupby = [groupby];
    return target.map(function(d) {
      var result = groupby.map(function(g) {
        var el = {};
        el.layout_key = g;
        el.layout_value = d[g];
        if(scale) el.layout_scaled_value = scale[prefix+g](d[g]);
        for(var k in d) {
          if(d.hasOwnProperty(k)) el[k] = d[k];
        }
        return el;
      });
      return result;
    });
  };
  //exports.rank
  //exports.bin
  //exports.fold
  return exports;
};

d3.daisy.transform = function() {
  //데이터 변형 함수를 가지고 있다가 셀렉션을 입력하여 실행시키면  변형된 데이터가 출력
  var origin, transformed;
  var transforms = []; //[{name:'name', options:{}}, ...]
  var exports = function(_selection) {
    origin =  _selection.datum();
    _executeAll();
    _selection.datum(transformed);
    return _selection;
  };
  function _executeAll() {
    transformed = origin;
    transforms.forEach(function(t) {
      if(_isValidTransform(t)) {
        _execute(t);
      }
    });
    return transformed;
  }
  function _execute(t) {
    transformed = d3.daisy.transformMethods()[t.name](transformed, t.options);
  }
  function _isValidTransform(t) { //t.name이 내부에 들어있는지
    return d3.daisy.transformMethods().hasOwnProperty(t.name);
  }
  exports.transform = function(_transform) {
    transforms.push(_transform);
    return exports;
  };
  exports.transforms = function(_transforms) {
    if(!arguments.length) {
      return transforms;
    }
    transforms = _transforms;
    return exports;
  };
  exports.origin = function() {
    return origin;
  };

  return exports;
};

d3.daisy.mark = function() {
  var attrs = {
    key : null, //update시에 사용되는 unique 키 이름을 위한 field TODO: array 일 경우 concat해서 내도록 변환
    type : 'rect',
    delay : 0,
    ease :'linear', //update때 사용
    events : {
      'click':true, 'mouseenter':true, 'mouseleave':true,
      'mousedown':true, 'mouseup':true // 드래깅 기능에 사용
    },
    data:null,
    properties :{ //
      enter:null,
      update:null,
      remove:null,
      hover:null
    },
    transition : 400, //TODO : transition 적용
    transform : null // 데이터 변형이 별도로 필요한 경우,
  };
  var types = ['rect','circle','symbol', 'path', 'arc', 'area', 'line', 'text'];//TODO: 'group', 'rule', 'image'
  var commonAttrs = [
    'x','x2','xc','width',
    'y','y2','yc','height'];
  var commonStyles = [
    'fill','opacity','fillOpacity',
    'stroke','strokeWidth','strokeOpacity','strokeDash','strokeDashOffset', 'strokeLinejoin',
    'cursor', 'shapeRendering', 'pointerEvents'
  ];
  var exclusiveAttrs = {
    circle : ['r'],
    symbol : ['type', 'size', 'shape'], //TODO : 현재 미구현
    arc :['innerRadius', 'outerRadius', 'startAngle', 'endAngle', 'padAngle'],
    area : ['orient', 'curve',  'alpha', 'beta', 'tension'],
    line : ['curve', 'alpha','beta','tension'], //TODO : 현재 커브는 step만 적용
    text : ['text','dx', 'dy', 'rotate', 'textLength', 'lengthAdjust', 'textAnchor']//'radius','align', 'baseline',
    //path : ['path'], //추후 반영, svg path 설정을 넘겨받음
  };
  var textLenAttrs = ['maxLength', 'maxWidth', 'ellipsis'],//추후 적용
    textStyles = ['font', 'fontSize','fontWeight', 'fontStyle', 'fontFamily'];
  var layer;
  var exports = d3.daisy.layer();

  function _enter(_selection, shape) {
    var property = attrs.properties.enter;
    if(property) {
      _selection.call(_applyPropertyOptions, property, shape);
    }
    _selection.call(exports.setEventEmitters, attrs.events); //기본 이벤트를 emit하도록 설정
    _selection.call(exports.setContainer); //새로 생긴 마크 selection을 보고 바로 container 찾아갈 수 있도록 지정
    return _selection;
  }
  function _update(_selection, shape) {
    var property = attrs.properties.update;
    if(property) _selection.call(_applyPropertyOptions, property, shape, true);
    return _selection;
  }
  function _remove(_selection, shape) {
    var property = attrs.properties.remove;
    if(property) {
      _selection.call(_applyPropertyOptions, property, shape)
      .remove();
    }
    return _selection;
  }
  function _hover(_selection, shape) {
    var property = attrs.properties.hover;
    if(property) {
      var name = exports.name();
      var nspace = name? '.' + name : '';
      _selection.on('mouseenter' + nspace, function() {
        d3.select(this).call(_applyPropertyOptions, property, shape);
      }).on('mouseleave' + nspace, function() {
        var updateProperty = attrs.properties.update;
        if(updateProperty) {
          d3.select(this).call(_applyPropertyOptions, updateProperty, shape);
        }
      });
    }
  }

  function _applyPropertyOptions(_selection, options, shape, fromUpdate) {
    var __applyExclusives = function() {
      var exclusives = exclusiveAttrs[attrs.type];
      if(attrs.type === 'circle') {
        exclusives.forEach(function(a) {
          if(options.hasOwnProperty(a)) _selection.attr(a, _value(a, options));
        });
      } else if (attrs.type === 'arc'){
        exclusives.forEach(function(a) {
          if(options.hasOwnProperty(a)) shape[a](_value(a, options));
        });
      } else if (attrs.type ==='text') {
        exclusives.forEach(function(a) {
          if(options.hasOwnProperty(a)) {
            if(a==='text') {
              var textFunc = function(d,i) {
                var content = _value('text', options)(d,i);
                //TODO : 길이 제한
                return content;
              };
              _selection.text(textFunc);
            } else  if(a === 'textAnchor') {
              _selection.attr('text-anchor', _value('textAnchor', options));
            } else {
              _selection.attr(a, _value(a, options));
            }
          }
        });
        textStyles.forEach(function(s) {
          if(options.hasOwnProperty(s)) {
            var cs;
            if( s === 'fontSize') cs = 'font-size' ;
            else if( s === 'fontWeight') cs = 'font-weight';
            else if (s === 'fontStyle') cs ='font-style';
            else if (s === 'fontFamily') cs ='font-family';
            else cs = s;
            _selection.style(cs, _value(s, options));
          }
        });
        //TODO : 텍스트 레이블 길이 조절textLenAttrs.forEach
      } else if( attrs.type === 'line' || attrs.type === 'area') {
        exclusives.forEach(function(a) {
          if(options.hasOwnProperty(a)){
            if(a === 'curve') {
              if(options[a] === 'stepped') {
                shape.curve(d3.curveStep);
              }
            }
          }
        });
      }
    };
    var __applyStyles = function() {
      commonStyles.forEach(function(s) {
        if(options.hasOwnProperty(s)) {
          var cs;
          if(s === 'strokeWidth') cs = 'stroke-width';
          else if(s === 'strokeOpacity') cs = 'stroke-opacity';
          else if(s === 'strokeDash') cs = 'stroke-dasharray';
          else if(s === 'strokeDashOffset') cs = 'stroke-dashoffset';
          else if(s === 'fillOpacity') cs = 'fill-opacity';
          else if(s === 'shapeRendering') cs = 'shape-rendering';
          else if(s === 'strokeLinejoin') cs = 'stroke-linejoin';
          else if(s === 'pointerEvents')cs = 'pointer-events';
          else cs = s;
          if(_isPoly()) _selection.style(cs, _value(s, options,true));
          else _selection.style(cs, _value(s, options));
        }
      });
    };

    var __applyCommons = function() {
      //commonAttrs에 속하는 요소들 처리
      if((options.hasOwnProperty('x') || options.hasOwnProperty('y')) && !_isPoly()) {
          var xyFunc = function(d) {
            return 'translate(' +
             (options.x ? _value('x', options)(d) : 0)  + ', ' +
             (options.y ? _value('y', options)(d) : 0 ) + ')';
          };
          _selection.attr('transform', xyFunc);
      }
      if(options.hasOwnProperty('x') ) { //x나 y가 있을 때
        if (attrs.type === 'line') {
          shape.x(_value('x', options));
        } else if (attrs.type === 'area') {
          if (options.hasOwnProperty('x2')) {
            shape.x1(_value('x', options));
          } else {
            shape.x(_value('x', options));
          }
        }
      }
      if(options.hasOwnProperty('y') ) { //x나 y가 있을 때
        if (attrs.type === 'line') {
          shape.y(_value('y', options));
        } else if (attrs.type === 'area') {
          if (options.hasOwnProperty('y2')) {
            shape.y1(_value('y', options));
          } else {
            shape.y(_value('y', options));
          }
        }
      }
      if (options.hasOwnProperty('x2')) { //x2가 있을 때
        if (attrs.type === 'rect' || attrs. type === 'circle') {
          var widthFunc = function(d) {
            return Math.abs(_value('x2', options)(d) - _value('x', options)(d));
          };
          if (attrs.type === 'rect') _selection.attr('width', widthFunc);
          else _selection.attr('rx', widthFunc);
        }
        else if (attrs.type === 'area') {
          shape.x0(_value('x2', options));
        }
      }
      if (options.hasOwnProperty('y2')) { //y2가 있으 ㄹ때
        if (attrs.type === 'rect' || attrs. type === 'circle') {
          var heightFunc = function(d) {
            return Math.abs(_value('y2', options)(d) - _value('y', options)(d));
          };
          if (attrs.type === 'rect') _selection.attr('height', heightFunc);
          else _selection.attr('ry', heightFunc);
        }
        else if (attrs.type === 'area') {
          shape.y0(_value('y2', options));
        }
      }
      if (options.hasOwnProperty('width')) { //width 가 있을 때
        if(attrs.type === 'rect') {
           _selection.attr('width', _value('width', options));
        } else if(attrs.type === 'circle') {
           _selection.attr('rx', _value('width', options));
        }
      }
      if (options.hasOwnProperty('height')) { //height이 있을때
        if(attrs.type === 'rect') {

           _selection.attr('height', _value('height', options));
        } else if(attrs.type === 'circle') {
           _selection.attr('ry', _value('height', options));
        }
      }
    };
    var __apply = function() { // type과 property의 key값을 가지고 적절한 형태의 shape함수나 attr설정을 한다.
      __applyCommons();
      __applyExclusives();
      __applyStyles();
      if(shape && fromUpdate) {
        _selection.attr('d', shape);
      }
    }; // the end of __apply
    __apply();
    return _selection;
  }
  function _value(k, options, isStyleForShape) { // value reference를 보고 실제 value 혹은 callback 함수를 내놓는다.
    /*
    value reference
     - value : constant 값
     - field : 정보 담고 있는 필드
       - object 인 경우(현재는 지원 X)
         - datum : datum 자체 가리킴
         - group : group 마크를 가리킴
         - parent : parent 의 필드 가리킴
     - index : true/false 단순히 순서의 영향을 받는 경우
     - band
     - mult
     - offset
     - callback : callback 함수를 직접 전달하는 경우
    */
    if(isStyleForShape === undefined) isStyleForShape = false;

    var v = options[k];
    var __postProcess = function(val) {
      if(v.mult !== null && v.mult !== undefined) {
        val *= v.mult;
      }
      if(v.offset !== null && v.offset !== undefined) {
        val += v.offset;
      }
      if(v.format !== null && v.format !== undefined  && typeof val === 'number') {
        val = v.format(+val);
      }
      return val;
    };

    if(!v) return function(){};
    if(v.callback) {
      return v.callback;
    } else if (v.value !== undefined) {
      if(v.scale) {
        return function() { return __postProcess(v.scale(v.value)); };
      } else {
        return function() { return __postProcess(v.value);};
      }
    } else if( typeof v === 'string' || typeof v === 'number'){
      return function() { return __postProcess(v);};
    } else if (v.band && v.scale) {
      return function () {
        return __postProcess(v.scale.bandwidth());
      };
    } else if(v.field !== undefined) {
      if(v.scale) {
          return function(d) {
            if(isStyleForShape) return __postProcess(v.scale(d[0][v.field]));
            return __postProcess(v.scale(d[v.field]));
          };
      } else {
        return function(d) {
          if(isStyleForShape) return __postProcess(d[0][v.field]);
          return __postProcess(d[v.field]);
        };
      }
    } else if(v.index !== undefined){
      if (v.scale) {
        return function(d,i) {return __postProcess(v.scale(d[i]));};
      } else {
        return function(d,i) {return d[i];
        };
      }
    } else {
      return function() {return 0; };
    }
  } // the end of ___value

  function _isPoly() {
    return (attrs.type === 'line' || attrs.type ==='area');
  }
  function _renderByType() {
    var mark, markEnter, shape;
    var name = exports.name();
    if( attrs.type === 'rect' || attrs.type === 'circle' || attrs.type === 'text') {
      mark = layer.selectAll('.mark')
        .data(function(d){return d;}, function(d,i){return attrs.key? d[attrs.key] : i;});
      markEnter = mark.enter().append(attrs.type)
        .attr('class', 'mark')
        .call(_enter);
    } else if (attrs.type === 'symbol' || attrs.type === 'arc'){
      shape = d3[attrs.type]();
      mark = layer.selectAll('.mark')
        .data (function(d){return d;}, function(d,i){return attrs.key? d[attrs.key] : i;});
      markEnter = mark.enter().append('path')
          .attr('class', 'mark')
          .call(_enter, shape);
    } else if(_isPoly()) {
      shape = d3[attrs.type]();
      mark = layer.selectAll('.mark')
        .data(function(d){return [d];});
      markEnter = mark.enter().append('path')
          .attr('class', 'mark')
          .call(_enter, shape);
    } else {
      //TODO : error 발생;
    }
    mark.exit()
      .call(_remove, shape);
    mark = markEnter.merge(mark) //UPDATE
      .call(_update, shape)
      .call(_hover, shape);
    if(exports.name()) mark.classed(exports.name(), true);
  }

  function _render() { //TODO : update 함수 정리
    layer = exports.layer();
    if(attrs.data) {
      layter.datum(attrs.data);
    } else {
      layer.datum(exports.container().datum());
    }
    if(attrs.transform) {
      layer.call(attrs.transform);
    }
    _renderByType();
  }

  exports.value = _value;

  exports.type = function(_type) {
    if(!arguments.length) return attrs.type;
    else {
      attrs.type = _type;
      return exports;
    }
  };
  exports.render = function() {
    _render();
  };
  //property들을 직접 접근할 수 있도록 한다.
  ['enter','update','remove','hover'].forEach(function(k) {
    exports[k] = function(v) {
      if(!arguments.length) return attrs.properties[k];
      attrs.properties[k] = v;
      return exports;
    };
  });
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.group = function() {
  var attrs = {
    field : 'values',//sub mark를 만들때 사용되는 키를 가리킨다. nested 된 구조 일때 주로 사용될 것
    key:null,//group별 key가 될 데이터 field
    type:'group',
    width:0, //TODO : innerWidth, innerHeight 적는다
    height:0,
    clip:false, //true이면 width height가 활성화
  };
  var layer;
  var exports = d3.daisy.frame();
  exports.type('group');
  var attrNames = ['x', 'y'];
  function _render() {
    layer = exports.layer();
    //DATA TRNSFROM : data-transform을 함
    if(exports.transform()) {
      layer.call(exports.transform());
    }
    //CONNECT DATA
    var groups = layer.selectAll('.grouped.mark') // 각각은 {key:, values:} 형태
      .data(function(d){return d.map(function(m){
        var v =  m[attrs.field]; //mark를 만들 datum을 각각 갖도록 한다
        if(!v) v = m; //attrs.field에 대한 데이터가 없으면 개별 배열 사용
        return v;
      }); }, function(d){if(attrs.key) return d[0][attrs.key];});
    //REMOVE;
    groups.exit()
      .call(_remove);

    //ENTER
    var groupsEnter = groups.enter().append('g')
      .attr('class', 'grouped mark '+ (exports.name() ? exports.name() : ''))
        .merge(groups)
      .call(_enter)
      .merge(groups)
      .call(_update)
      .each(function(d,i) { //mark를 실행
        var self = d3.select(this);
        exports.marks().forEach(function(m) {
          _mark(m, self);
        });
        exports.tooltips().forEach(function(t) {
          _tooltip(t, self);
        });
      });
  }
  function _tooltip(tooltip, self,i) { //tooltip의 실행에 사용
    tooltip.container(self)
      .render();
  }
  function _mark(mark, self,i) { //mark의 실행에 사용
    mark.container(self)
      .render();
  }
  function _applyPropertyOptions(_selection, options) { //TODO : 현재 x,y위치만 변경할 수 있으므로 확장이 필요
    if((options.hasOwnProperty('x') || options.hasOwnProperty('y'))) {
        var xyFunc = function(d) { //FIXME : values만 값으로 가지므로 접근시 문제 발생. 현재는 d[0]를 탐색하도록 함
          return 'translate(' +
           (options.x ? exports.value('x', options)(d[0]) : 0)  + ', ' +
           (options.y ? exports.value('y', options)(d[0]) : 0 ) + ')';
        };
        _selection.attr('transform', xyFunc);
    }
  }
  function _enter(_selection) {
    var property = exports.properties().enter;
    if(property) {
      _selection.call(_applyPropertyOptions, property);
    }
    return _selection;
  }
  function _update(_selection) {
    var property = exports.properties().update;
    if(property) _selection.call(_applyPropertyOptions, property);
    return _selection;
  }
  function _remove(_selection) {
    var property = exports.properties().remove;
    if(property) {
      _selection.call(_applyPropertyOptions, property)
      .remove();
    }
    return _selection;
  }
  exports.render = function() {
    _render();
    return exports;
  };
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.axis = function(orient) {
  var orients = ['top', 'right', 'bottom', 'left'];
  var attrs = {
    orient : 'bottom',
    x:0,
    y:0,
    scale : null, //Required
    grid : false,
    title : null, //TODO 타이틀 추가 기능
    titleOffset : 0,
    tickFormat : null, // d3.format 사용 //",.0f"
    formatType: 'number', //'utc', 'string', 'number', 'time'
    ticks :null, //tick 숫자 수동 결정
    tickValues : null, //tick 내용을 수동으로 결정
    tickSize : null,
    tickSizeOuter : null,
    tickSizeInner : null,
    tickPadding : null,
    stroke : '#999', //선 색상
    strokeWidth : null, // 선 두께
    domainVisible : true,
    minLabelLength : 2,
    order : 'back', // 'front' 이면 앞으로 위치
    font : d3.daisy.default.font() //TODO : 전체 font 설정 가져오기, 상속부분 설정
  };
  //TODO : tick label 겹침 이슈 해결
  var events  = [];
  var axis, layer;
  attrs.orient = orient || 'bottom';
  var exports = d3.daisy.layer();
  function _render() {
    layer = exports.layer();
    layer.classed('axis', true);
    if(exports.name()) layer.classed(exports.name(), true);
    _axis();
    _setting();
    var pos = [attrs.x,attrs.y];
    pos = pos.map(function(d) {
      if(typeof d === 'string') {
        if(d=== 'width') {
          return exports.container().innerSize()[0];
        } else if (d==='height') {
          return exports.container().innerSize()[1];
        } else {
          return d;
        }
      } else {
        return d;
      }
    });

    layer.attr('transform', 'translate('+ pos + ')')
      .call(axis);
    _style();
  }

  function _axis(){
    if(attrs.orient === 'top') { //TODO: axis init
      axis = d3.axisTop();
    } else if(attrs.orient === 'right') {
      axis = d3.axisRight();
    } else if(attrs.orient === 'bottom') {
      axis = d3.axisBottom();
    } else if(attrs.orient === 'left') {
      axis = d3.axisLeft();
    }
    axis.tickSize(0);
    if(attrs.orient === 'top' || attrs.orient === 'bottom') {
      axis.tickPadding(6);
    }
    if(attrs.scale.type() === 'linear' || attrs.scale.type() === 'time') {
      axis.ticks(8);
    }
    if(attrs.scale.type() === 'linear') {
      var domain = attrs.scale.domain();
      if(domain[1] >= 100000 && Math.abs(domain[1]- domain[0]) >= 100) axis.tickFormat(d3.format(".3g"));
    } else if(attrs.scale.type() === 'band' || attrs.scale.type()=== 'point') {
      //TODO : label 길이 수정
    }
  }

  function _setting() {
    axis.scale(attrs.scale.scale()); //Required
    if(attrs.ticks !== null) axis.ticks(attrs.ticks);
    if(attrs.tickFormat !== null) {
      axis.tickFormat(
        attrs.formatType === 'time' ? d3.timeFormat(attrs.tickFormat): d3.format(attrs.tickFormat)
      );
    }
    if(attrs.tickValues !== null) axis.tickValues(attrs.tickValues);
    if(attrs.tickSize !== null) axis.tickSize(attrs.tickSize);
    if(attrs.tickSizeOuter !== null) axis.tickSizeOuter(attrs.tickSizeOuter);
    if(attrs.tickSizeInner !== null) axis.tickSizeInner(attrs.tickSizeInner);
    if(attrs.tickPadding !== null) axis.tickPadding(attrs.tickPadding);
    //TODO : grid가 켜진 경우 처리
    //if(attrs.grid ==== true)
  }

  function _style() {
    var __overflow = function(_selection, maxSize, depth) {
      //selection 별로 처리
      depth = depth || 1;
      var text = _selection.datum();
      var textW = _selection.node().getBBox().width;
      if(text.length-depth < attrs.minLabelLength ||  textW <= maxSize) {
        return _selection;
      } else {
        _selection.text(text.slice(0, text.length-depth) + '…')
          .call(__overflow, maxSize, depth+1);
      }
    };
    var __totalWidth = function() {
      var w = 0;
      layer.selectAll('.tick > text').each(function() {
        w += this.getBBox().width;
      });
      return w;
    };
    layer.selectAll('path.domain')
      .style('visibility', attrs.domainVisible ? 'visible':'hidden')
      .style('stroke', attrs.stroke);
    layer.selectAll('.tick line')
      .style('stroke', attrs.stroke);
    layer.selectAll('.tick text')
      .style('fill', attrs.stroke);
    //TODO : domain과 tick 조절
    //TODO : tick의 text font 변화
    if (attrs.scale.type()==='band' || attrs.scale.type()==='point') {
      var maxW, padding = 8;
      if(attrs.orient === 'top' || attrs.orient === 'bottom') {
        if(attrs.scale.type() === 'band') maxW = attrs.scale.bandwidth();
        else maxW = attrs.scale.step();
      } else {
        var margin = exports.container().daisyModule().margin();
        if(attrs.orient === 'left')maxW = margin.left;
        else maxW = margin.right;
      }
      layer.selectAll('.tick > text').each(function() {
        d3.select(this).call(__overflow, maxW-padding, 1);
      });
    }

    // 줄인 후에도 겹친다면
    if(attrs.orient === 'top' || attrs.orient === 'bottom') {
      var labelW = __totalWidth(),
       axisW = Math.abs(attrs.scale.range()[1] - attrs.scale.range()[0]);
      if(labelW >=axisW)  {
        layer.selectAll('.tick:nth-child(2n+1) > text').attr('dy', '1.71em');
      }
    }
  }

  function _title() {
    if(attrs.title) {
      //axisG에 orient를 고려하여 추가
    }
  }

  exports.render = function() { //layer를 overwrite
    //TODO : container에 svg를 추가하고, 그림
    _render();
  };
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.legend = function() {
  var orients = ['top', 'right', 'bottom', 'left'];
  var defaultSize = 44;
  var attrs = {
    name : null,
    orient : 'bottom', //방향을 보고 container에서 위치를 잡음
    scale : null, //컬러 스케일, 현재는 ordinal만
    x : 0,
    y : 0,
    width : defaultSize,
    height : defaultSize,
    tooltip : false,  //container에서 툴팁 만들게 하고, 이벤트에도 추가,
    margin:{top:28, right:4, bottom:20, left:4},
    labelHeight : 12,
    labelPadding : 4,
    chipSize : 12,
    chipPadding : 2,
    maxLabelLength : 12,
    font : d3.daisy.default.font()
  };
  var layer;
  var events = []; //TODO : eventEmitter 추가
  var exports = d3.daisy.layer();
  var innerWidth, innerHeight;
  function _reset() {
    attrs.labelHeight = attrs.font.fontSize;
    var size = exports.container().innerSize();
    if(exports.isHorizontal()) { //top-bottom
      attrs.y = size[1];
      attrs.x = 0;
      attrs.width = size[0];
    } else {
      attrs.x = size[0];
      attrs.y = 0;
      attrs.height = size[1];
    }
    innerWidth = attrs.width - attrs.margin.left-attrs.margin.right;
    innerHeight = attrs.height - attrs.margin.top - attrs.margin.bottom;
    layer.classed('legend', true)
      .attr('transform', 'translate('+ [attrs.x+attrs.margin.left, attrs.y + attrs.margin.top] + ')');
  }

  function _render() {
    layer = exports.layer();
    _reset();

    if(attrs.scale.type() === 'ordinal') {

    } else {
      //TODO : 그라데이션 추가
    }
    var legend = layer.selectAll('.legend-item')
      .data(attrs.scale.domain());

    var legendEnter = legend.enter().append('g')
      .attr('class', 'legend-item ' + name);

    legendEnter.append('rect')
      .attr('class', 'chip')
      .attr('x', attrs.chipPadding).attr('y', attrs.chipPadding)
      .attr('width', attrs.chipSize)
      .attr('height', attrs.chipSize)
      .style('fill', function(d){return attrs.scale(d);});

    legendEnter.append('text')
      .attr('class', 'label')
      .attr('x', attrs.chipSize + attrs.chipPadding*2)
      .attr('y', attrs.chipSize*0.5 + attrs.chipPadding)
      .attr('dy', '.35em')
      .style('font-family', attrs.font.fontFamily)
      .style('font-size', attrs.font.fontSize + 'px')
      .style('font-weight', attrs.font.fontWeight)
      .text(function(d){
        if(d.length > attrs.maxLabelLength) return d.slice(0, attrs.maxLabelLength) + '…';
        else return d;
      });

    legend = legendEnter.merge(legend)
      .call(_translate);
    //.call(setEventEmitters, {'mouseenter':true, 'mouseleave':true});
  }

  function _translate(selection){
    var xyr = d3.local(); //FIXME 화살표 위한 공간 남도록 세팅
    var accumulated = 0, row = 0, minRowNum = 0, maxRowNum = 0;
    selection.each(function(d) {
      var x,y,labelWidth;
      if(exports.isHorizontal()) {
        labelWidth = d3.select(this).node().getBBox().width;
        if (accumulated > 0 && accumulated +labelWidth  >= attrs.width - attrs.labelHeight-attrs.labelPadding*2) { // 두번째 칸 이상 경우만 확인
          accumulated = 0;
          row += 1;
        }
        x = accumulated;
        y = row * (attrs.labelHeight+attrs.labelPadding);
        xyr.set(this, {x:x, y:y, row:row});

        if(y + attrs.labelHeight >= attrs.height) {
          if(minRowNum === 0 ) minRowNum = row;
          if(maxRowNum < row) maxRowNum = row;
          d3.select(this).classed('hidden', true)
           .style('display', 'none');
        }
        accumulated += labelWidth + attrs.labelPadding*1.5;
      } else {
         y = accumulated;
         xyr.set(this, {x:0, y:y, row:row});
         if (y + attrs.labelHeight >= attrs.height  - attrs.labelHeight - attrs.labelPadding*2) { //FIXME : hidden이 시작되는 row보고 maxRow 결정
           if(minRowNum === 0 ) minRowNum = row;
           if(maxRowNum < row) maxRowNum = row;
           d3.select(this).classed('hidden', true)
            .style('display', 'none');
         }
         accumulated += attrs.labelHeight + attrs.labelPadding;
         row += 1;
         //TODO legend 가 넘어가는 경우 별도 처리
      }
    })
    .attr('transform', function(d, i) {
      return 'translate('+ [xyr.get(this).x, xyr.get(this).y] + ')';
    });
    if(minRowNum > 0) {
      selection.call(_page, minRowNum, maxRowNum, xyr);
    }
    return selection;
  }

  function _page(selection, minRowNum, maxRowNum, xyr) { //rowNum : 0-based
    var curRowNum = minRowNum;
    var __updateArrow = function(_selection) {
      if (curRowNum === minRowNum) {
        _selection.classed('hidden', function(d){return d === 'up';});
      } else if (curRowNum > maxRowNum) {
        _selection.classed('hidden', function(d){return d === 'down';});
      } else {
        _selection.classed('hidden', false);
      }
      _selection.filter(function(){
        return d3.select(this).classed('hidden');
      }).style('fill-opacity', 0.2)
      .style('pointer-events', 'none');

      _selection.filter(function(d,i){
        return !d3.select(this).classed('hidden');
      }).style('fill-opacity', 1.0)
      .style('cursor', 'pointer')
      .style('pointer-events', 'auto');

      return _selection;
    };
    var __updateLegend = function(_selection) {
      _selection.classed('hidden', function() {
        var row = xyr.get(this).row;
        return row < curRowNum - minRowNum  || row >= curRowNum;
      }).style('display', 'none');
      _selection.filter(function(){
        return !d3.select(this).classed('hidden');
      }).style('display', 'inherit');
      _selection.attr('transform', function() {
        var y = xyr.get(this).y;
        y -= (curRowNum - minRowNum) * (attrs.labelHeight+attrs.labelPadding);
        return 'translate('+[xyr.get(this).x, y]+')';
      });
      return _selection;
    };

    var parent = d3.select(selection.node().parentNode);
    var arrow = parent.selectAll('.arrow')
      .data(['up', 'down'])
        .enter().append('path')
      .attr('class', 'arrow')
      .attr('d', d3.symbol().type(d3.symbolTriangle).size(attrs.labelHeight*2.5))
      .attr('transform', function(d,i) {
        var translate;
        if(exports.isHorizontal) {
         translate =  'translate('+ [
            attrs.width - attrs.labelPadding - attrs.labelHeight,
            i*(attrs.labelPadding+attrs.labelHeight) + attrs.chipSize*0.5 + attrs.chipPadding
          ] + ')' ;
        } else {
          translate = 'translate('+ [
             attrs.labelPadding + attrs.labelHeight,
             attrs.height - (attrs.labelPadding + attrs.labelHeight) + i*(attrs.labelPadding+attrs.labelHeight)
           ] + ')' ;
        }
        return translate +  (i===1 ? 'rotate(180)' : '');
      })
      .style('display', 'block')
      .style('fill', d3.daisy.default.schemeCategory10()[0])
      .call(__updateArrow);

    arrow.on('click', function(d) {
        if(d === 'down' && curRowNum <= maxRowNum ) curRowNum += 1;
        else if (d === 'up' && curRowNum > minRowNum) curRowNum -= 1;
        else return ;
        arrow.call(__updateArrow);
        selection.call(__updateLegend);
      });
    return selection;
  }
  exports.orient = function(o) {
    if(!arguments.length) return attrs.orient;
    attrs.orient = o;
    attrs.x = 0; attrs.y = 0;
    attrs.width = defaultSize; attrs.height = defaultSize;
    return exports;
  };
  exports.isHorizontal = function() {
    return attrs.orient === 'top' || attrs.orient === 'bottom';
  };
  exports.render = function() {
    _render();
  };
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.tooltip = function() { //group mark 의 일종으로 보자!
  //TODO : 추후 tooltip 값 추가
  var attrs = {
    keyField  : null, // update 시에 적용
    valueField : null,
    padding : 4,
    font : d3.daisy.default.font(),
    moveToFront : true,
    center:false
  };
  var layer, tooltip, rectMark, keyMark, valueMark, w, h;
  var exports = d3.daisy.group(); //group을 상속받는 형태
  _pre();
  function _pre() { // mark는 최초에 생성해둔다.ㄴ
    rectMark = d3.daisy.mark()
      .type('rect')
      .name('background');

    keyMark = d3.daisy.mark()
      .type('text')
      .name('keyLabel');

    valueMark = d3.daisy.mark()
      .type('text')
      .name('valueLabel');

    exports.marks([rectMark, keyMark, valueMark]);
  }
  function _init () {
    var initVal =  {};
    exports.datum(initVal);
    h = attrs.padding*2+attrs.font.fontSize*2;
    tooltip = layer.selectAll('.grouped.mark.tooltip')
      .data(function(d){return [d];})
        .enter().append('g')
      .attr('class', 'grouped mark tooltip' +(exports.name() ? exports.name() : '') )
      .style('pointer-events', 'none')
      .style('font-size', attrs.font.fontSize + 'px')
      .style('font-family', attrs.font.fontFamily)
      .call(_enter);
    rectMark
      .enter({
        fill:{value:'#fff'},
        fillOpacity:{value:0.75},
        height:{value:h},
        stroke:{value:'#ccc'},
        strokeWidth:{value:'.5px'}
      });
    keyMark
      .enter({
        fontWeight:{value:'bold'},
        dx:{value:attrs.padding},
        y:{value:attrs.padding},
        dy:{value:'.71em'},
      })
      .update({text: attrs.keyField}); //FIXME : 필드명 이외에 전체 받을 수 있도록 처리
    valueMark.enter({
        y:{value:attrs.font.fontSize+attrs.padding*2},
        dx:{value:attrs.padding},
        dy:{value:'.71em'}
      })
      .update({text: attrs.valueField}); //FIXME : 필드명 이외에 전체 받을 수 있도록 처리
    exports.hide();
  }
  function _layer() {
    layer = exports.layer();
    tooltip = layer.selectAll('.grouped.mark.tooltip');
    if(tooltip.empty()) {
      _init();
    }
  }
  function _render () {
    _layer();
    _tooltip();
  }

  function _applyPropertyOptions(_selection, options) {
    var offsetW = 0, offsetH = 0;
    if((options.hasOwnProperty('x') || options.hasOwnProperty('y'))) {
        var xyFunc = function(d) { //실제로는 values의 값을 사용
          if(attrs.center) {
            offsetW = w * 0.5;
            offsetH = h * 0.5;
          }
          var x = options.x ? exports.value('x', options)(d[0]) : 0;
          var y  = options.y ? exports.value('y', options)(d[0]) : 0 ;
          return 'translate(' + [(x? x: 0) -offsetW , (y? y : 0)-offsetH]+ ')';
        };
        _selection.attr('transform', xyFunc);
    }
  }
  function _enter(_selection) {
    var property = exports.properties().enter;
    if(property) {
      _selection.call(_applyPropertyOptions, property);
    }
    return _selection;
  }
  function _update(_selection) {
    var property = exports.properties().update;
    if(property) _selection.call(_applyPropertyOptions, property);
    return _selection;
  }

  function _tooltip() {
    tooltip.data([layer.datum()]);
    rectMark.update({width:attrs.padding*2});

    tooltip.each(function(d,i) {
      var self = d3.select(this);
      exports.marks().forEach(function(m) {
        _mark(m, self,i);
      });
    });
    w = tooltip.node().getBBox().width + attrs.padding*2;
    rectMark.update({width:{value:w}})
      .render();
    tooltip.call(_update);
  }
  function _mark(mark, self,i) {
    mark.container(self)
      //.layerIndex(i) //group 의 경우 하나의 마크를 공유하므로
      .render();
  }

  exports.render = function() {
    _render();
  };

  exports.datum = function(datum) {
    if(!arguments.length) return layer.datum();
    layer.datum([datum]);
    return exports;
  };
  exports.show = function(target) {
    if(arguments.length) {
      var container = target.container();
      exports.container(container);
      _layer();
      if(attrs.moveToFront) container.moveToFront();
      exports.datum(target.datum()); //target을 두고 사용
    }
    _render();
    tooltip.style('opacity', 1);
    return exports;
  };
  exports.hide = function(target) {
    if(arguments.length) {
      exports.container(target.container());
      //target을 두고 사용
      _layer();
    }
    tooltip.style('opacity', 0);
    return exports;
  };
  exports.keyField = function(_value) {
    if(!arguments) return attrs.keyField;
    if(typeof _value == 'string') {
      attrs.keyField = {field:_value};
    } else {
      attrs.keyField = _value;
    }
    return exports;
  };
  exports.valueField = function(_value) {
    if(!arguments) return attrs.valueField;
    if(typeof _value == 'string') {
      attrs.valueField = {field:_value};
    } else {
      attrs.valueField = _value;
    }
    if(!attrs.valueField.format) attrs.valueField.format = d3.format(',');
    return exports;
  };
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.frame = function() {
  var attrs = {
    width : 600,
    height : 500,
    marks : [], //grouped mark 도 포함한
    legends : [], //FIXME : 현재는 다른 스케일 설정이전에 레전드를 설정해둬야함
    axes : [],
    tooltips : [],
    scales : [],
    margin:{top:30, right:30, bottom:30, left:30}
  };
  //var layer;
  var svg;
  var dispatch = d3.dispatch('beforesend','progress', 'load', 'error');
  var exports = d3.daisy.mark();
  exports.type('frame');
  var innerWidth, innerHeight; //내부 실제 공간 크기
  _pre();
  function _pre() {

  }
  function _init() {
    if(!svg) {
      var container = exports.container();
      svg = container.append('svg')
        .append('g').attr('class', 'frame layer')
        .call(exports.setDaisyModule);
      exports.layer(svg);
    }
    _innerViewBox();
    var svgR = d3.select(svg.node().parentNode).attr('width', attrs.width)
      .attr('height', attrs.height)
      .attr('viewBox', '0 0 ' + attrs.width + ' ' + attrs.height);
    if(exports.name()) svgR.classed(exports.name(), true);

    svg.datum(exports.data());

    var pos = [0, 0];
    attrs.legends.forEach(function(l){
      if(l.orient() === 'top') {
        pos[1] += l.height();
      } else if(l.orient() === 'left') {
        pos[0] += l.width();
      }
    });
    svg.attr('transform',
      'translate('+ [(attrs.margin.left + pos[0]) ,attrs.margin.top + pos[1]]+')');
  }

  function _innerViewBox() {
    innerWidth = attrs.width - attrs.margin.left - attrs.margin.right;
    innerHeight = attrs.height - attrs.margin.top - attrs.margin.bottom;

    attrs.legends.forEach(function(l){
      if(l.isHorizontal()) {
        innerHeight -= l.height();
      } else {
        innerWidth -= l.width();
      }
    });
    if(svg) { //svg있기전에 설정이 안되기 때문
      svg.innerSize([innerWidth, innerHeight]); //svg의 허용 사이즈 저장
    }
  }
  function _style() {
    svg.style();
  }

  function _render() {
    _init(); // svg 초기화
    if(exports.transform()) {
      svg.call(exports.transform());
    } //transform data;
    attrs.axes.forEach(function(a) {
      if(a.order() === 'back') _axis(a);
    });
    attrs.marks.forEach(function(m) {
      _mark(m);
    });
    attrs.axes.forEach(function(a) {
      if(a.order() === 'front') _axis(a);
    });
    attrs.legends.forEach(function(l) {
      _legend(l);
    });
    attrs.tooltips.forEach(function(t) {
      _tooltip(t);
    });
  }

  function _mark(mark) { //mark의 실행에 사용
    mark.container(svg)
      .render();
  }

  function _legend(legend) {
    legend.container(svg)
      .render();
  }

  function _tooltip(tooltip) {
    tooltip.container(svg)
      .render();
  }

  function _axis(axis) {
    axis.container(svg)
      .render();
  }
  exports.width = function(_val) {
    if(!arguments.length) return attrs.width;
    attrs.width = _val;
    _innerViewBox();
    return exports;
  };
  exports.height = function(_val) {
    if(!arguments.length) return attrs.height;
    attrs.height = _val;
    _innerViewBox();
    return exports;
  };
  exports.render = function() {
    _render();
  };
  exports.innerWidth = function() { //FIXME : 개정시 개정된 값을 전달할 수 있는 방법 없나?
    return innerWidth;
  };
  exports.innerHeight = function() {
    return innerHeight;
  };
  exports.innerViewBox = function() {
    return [innerWidth, innerHeight];
  };
  exports.axis = function(a) {
    attrs.axes.push(a);
    _innerViewBox();
    return exports;
  };
  exports.legend = function(l) { //추가 될 때마다 위치 재계산
    attrs.legends.push(l);
    _innerViewBox();
    return exports;
  };
  exports.scale = function(s) {
    attrs.scales.push(s);
    return exports;
  };
  exports.mark = function(m) {
    attrs.marks.push(m);
    return exports;
  };
  exports.tooltip = function(t) {
    attrs.tooltips.push(t);
    return exports;
  };
  exports.margin = function(m) {
    if(!arguments.length) return attrs.margin;
    else {
      for (var k in m) {
        if(m.hasOwnProperty(k)) attrs.margin[k] = m[k]; //ex. attrs.margin.left = m.left;
      }
    }
    return exports;
  };
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

//# sourceMappingURL=daisy.js.map