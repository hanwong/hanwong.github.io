d3.daisy.layout = {};

d3.daisy.layout.default = function() {
  var attrs = {
    width : 600,
    height : 500,
    margin : {top:40, right:40, bottom:40, left:40},
    data : null, // table 형태
    container : null,
    dimensions:[],
    measures :[], //[{field, aggs}]
    stacked : false,
    axes : [],
    tooltip : true,
    legend : true,
    shape : null,
    curve : null,
    color : null,
    orient : 'vertical',
    hoverColor : 'LemonChiffon',
    dimensionMax: 100
  };
  function dimensionType (dimension) {
    if(typeof dimension === 'string') {
     return {field:dimension, order:'natural', max:attrs.dimensionMax};
   } else if(typeof dimension ==='object') {
      if(!dimension.max)dimension.max = attrs.dimensionMax;
      if(!dimension.order)dimension.order = 'natural';
      return dimension;
    }
  }
  var exports = {};

  exports.limit = function(target, dimension) {
    var domain = d3.daisy.transformMethods()
      .set(target, {field:[dimension.field]});

    domain = exports.sort(domain, dimension.order);
    if(!dimension.max) dimension.max = attrs.dimensionMax;
    if(domain.length > dimension.max) {
      domain = domain.slice(0, dimension.max);
      target = target.filter(function(d) {
        return domain.indexOf(d[dimension.field]) >= 0;
      });
    }
    return target;
  };
  exports.sort = function(target, order) {
    if(order !== 'natural') {
      return d3.daisy.transformMethods()
        .sort(target, {order:order});
    } else {
      return target;
    }
  };
  exports.axis = function(_val) {
    if(typeof _val === 'string') {
      attrs.axes.push({orient:_val});
    } else if(typeof _val ==='object') {
      attrs.axes.push(_val);
    }
    return exports;
  };

  exports.axes = function(_val) {
    if (!arguments.length) return attrs.axes;
    var _type = function(v) {
      if(typeof v === 'string') {
        return  {orient:v};
      } else if(typeof v ==='object') {
        return v;
      }
    };
    if(Array.isArray(_val)){
      attrs.axes  = _val.map(function(v) { return _type(v); });
    } else {
      attrs.axes = [_type(_val)];
    }
    return exports;
  };

  exports.measures = function(_val) {
    if (!arguments.length) return attrs.measures;
    var _type = function(v) {
      if(typeof v === 'string') {
        return  {field:v, op:'sum'};
      } else if(typeof v ==='object') {
        return v;
      }
    };
    if(Array.isArray(_val)){
      attrs.measures  = _val.map(function(v) { return _type(v); });
    } else {
      attrs.measures = [_type(_val)];
    }
    return exports;
  };
  exports.dimensions = function(_val) {
    if (!arguments.length) return attrs.dimensions;

    if(!Array.isArray(_val)){
      _val = [_val];
    }
    attrs.dimensions  = _val.map(function(v) { return dimensionType(v); });
    return exports;
  };
  exports.dimension = function(_val) {
    attrs.dimensions.push(dimensionType(_val));
    return exports;
  };
  exports.measure = function(_val) {
    if(typeof _val === 'string') {
      attrs.measures.push({field:_val, op:'sum'});
    } else if(typeof _val ==='object') {
      attrs.measures.push(_val);
    }
    return exports;
  };
  exports.defaultLegend = function() {
    return { orient : 'bottom', font : d3.daisy.default.font()};
  };
  exports.renderFuncs = function() {
    var funcs = ['_condition', '_frame', '_scale', '_axis', '_mark', '_legend', '_tooltip', '_render'];
    return funcs;
  };
  exports.render = function() {
    exports.renderFuncs().forEach(function(f) {
      if(exports[f]) exports[f]();
    });
  };
  exports.arrangeDomain = function(domain) { //FIXME 범위를 rounding 하여 통제  [min, max] 인 경우에만 사용

    if (domain.length === 2 &&
      (Object.prototype.toString.call(domain[0]) !== '[object Date]') &&
      domain[0] <= domain[1] &&
      domain[0] * domain[1] > 0) { //방향이 같은 경우
      if(domain[0] > 0) domain[0] = 0; //min을 0으로
      else domain[1] = 0;
      return domain;
    } else {
      return domain;
    }
  };
  exports.size = function(_size) {
    if(!arguments.length) return attrs.size;
    if(Array.isArray(_size)) { //range만 들어온 경우
      attrs.size = {range:_size, scale:'linear', reverse:false};
    } else if(typeof _size == 'number') {//숫자만 들어온 경우
      attrs.size = {range:[_size, _size], scale:'linear', reverse:false};
    } else if(typeof _size == 'object') {
      attrs.size = _size;
    }
    return exports;
  };
  exports.mixedScale = function(domain) {
    var isNumber = false,
      isDate=false,
      type = 'point';
    domain.forEach(function(d) { //naive 하게 범위가 숫자인지 확인
      if(typeof d === 'number' || (!isNaN(d) && (+d.toString() === d ))) {
        isNumber = true;
      } else {
        isNumber = false;
      }
      if(Object.prototype.toString.call(d) === '[object Date]') {
        isDate = true;
      } else {
        isDate = false;
      }
    });
    if(isNumber || isDate) {
      domain = d3.extent(domain);
      type='linear';
    }
    if(isDate) {
      type='time';
    }
    var scale = d3.daisy.scale().type(type)
      .domain(domain);
    return scale;
  };
  exports.cScale = function(domain, type, defaultColor) {
    return d3.daisy.scale().type(type)
      .domain(domain)
      .range(attrs.color ? attrs.color : defaultColor );
  };
  exports.ordinalCScale = function(domain, defaultColor) {
    return exports.cScale(domain, 'ordinal', defaultColor);
  };
  exports.linearCScale = function(domain, defaultColor) {
    return exports.cScale(domain, 'linear', defaultColor);
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
  exports.defaultMeasureForCount = function() {
    return { field : 'defaultMeasure', op:'count'};
  };
  exports.conditionException = function() {
    function CondtionException() {
      this.message = 'unavailable condtion';
      this.name = "CondtionException";
    }
    throw new CondtionException();
  };
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.bar = function() {
  var attrs = {};
  var defaultDimensionForMixed = {field : '__melted_key__', order:'natural'},
    defaultMeasureForMixed = {field : '__melted_value__', op:'mean'},
    defaultColor = d3.daisy.default.schemeCategory20();
  var frame, condition, orient, legend, data, measures, dimensions;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['histogram', 'normal', 'mixed'];

  var exports = d3.daisy.layout.default();
  _init();
  function _init() {
    exports._condition = _condition;
    exports._frame = _frame;
    exports._scale = _scale;
    exports._axis = _axis;
    exports._mark = _mark;
    exports._legend = _legend;
    exports._tooltip = _tooltip;
    exports._render = _render;
  }
  function _render() {
    frame.render();
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(dimensions.length === 0 ) {
      exports.conditionException();  // TODO : error를 내보낸다.
    }

    if(measures.length === 0) {
      if(dimensions.length <= 2) {
        condition = 'histogram';
      } else {
        exports.conditionException(); //TODO : throw error
      }
    } else if (measures.length === 1) {
      if(dimensions.length <= 2) {
        condition = 'normal';
      } else {
        exports.conditionException(); //TODO : throw error
      }
    } else {
      if(dimensions.length === 1) {
        condition = 'mixed';
      } else {
        exports.conditionException(); //TODO : throw error
      }
    }
    orient = exports.orient();
  }

  function _frame() {
    data = exports.data();
    if(condition === 'mixed') { //mixed 인 경우 데이터 형태를 선변환
      data = d3.daisy.transformMethods() //measure의 op에 따라 aggregate 해야하므로 aggregate를 선행
        .aggregate(data,
          {summarize:measures.map(function(d) {
            d.as = d.field;
            return d;
          }),
            groupby:dimensions.map(function(d){return d.field;})
          });
      data = d3.daisy.transformMethods()
        .melt(data,
          {groupby:dimensions.map(function(d){return d.field;}),
            field:measures.map(function(d){return d.field;})
          });
    }

    dimensions.forEach(function(dimension) {
      data = exports.limit(data, dimension); //bar는 모두 강제로 limit
    })
    frame = d3.daisy.frame()
      .container(exports.container())
      .width(exports.width()).height(exports.height())
      .margin(exports.margin())
      .data(data);
    var legendSetting = exports.legend();
    if(legendSetting) { //FIXME: 현재는 미리 legend를 설정해둬야함
      legend = d3.daisy.legend();
      if(typeof legendSetting === 'object') {
        legend.orient(legendSetting.orient);
      } else {
        legend.orient(exports.defaultLegend().orient);
      }
      frame.legend(legend);
    }
  }

  function _scale() { //set scale
    var __simpleXScale = function(xDomain, grouped) {
      scale.x = d3.daisy.scale().type('band')
        .domain(xDomain)
        .padding(0.05)
        .round(true);
      if(grouped) {
        scale.x.range([0, scale.region.bandwidth()]);
      } else {
        if(orient === 'horizontal') {
          scale.x.rangeFromFrame([0,'height'], frame);
        } else {
          scale.x.rangeFromFrame([0,'width'], frame);
        }
      }
    };
    var __xScale = function(dimension, grouped) {
      var xDomain = d3.daisy.transformMethods()
        .set(data, {field:[dimension.field]});
      xDomain = exports.sort(xDomain, dimension.order);
      __simpleXScale(xDomain, grouped);
    };

    var __cScale = function(dimension, mono) {
      var cDomain;
      if(!mono) {
        cDomain = d3.daisy.transformMethods()
          .set(data, {field:dimension.field});
      } else {
        cDomain = [dimension.field];
      }
      cDomain = exports.sort(cDomain, dimension.order);
      scale.c = exports.ordinalCScale(cDomain, defaultColor);
       //FIXME : domain 개수에 따라 카테고리 개수 변화
    };
    var __regionScale = function(dimension) {
      var regionDomain = d3.daisy.transformMethods().set(data, {field:[dimension.field]});
      regionDomain = exports.sort(regionDomain, dimension.order);
      scale.region = d3.daisy.scale().type('band')
        .domain(regionDomain)
        .padding(0.02)
        .round(true);
      if(orient === 'horizontal') {
        scale.region.rangeFromFrame([0,'height'], frame);
      } else {
        scale.region.rangeFromFrame([0,'width'], frame);
      }
    };
    var __yDomain = function(measure, stacked, dimensions, dimension0) {
      var yDomain = d3.daisy.transformMethods()
        .aggregate(data,
          {summarize:{field:measure.field, op:measure.op, as:measure.field},
            groupby:dimensions.map(function(d){return d.field;})
          });

      if(stacked) {
        var extent = d3.daisy.transformMethods()
          .aggregate(yDomain,
            {summarize:{field:measure.field, op:'sum', as:measure.field},
              groupby:[dimension0.field] //FIXME dimension을 가리키도록 수정
            });
        yDomain = yDomain.concat(extent);
      }

      yDomain = d3.daisy.transformMethods()
        .aggregate(yDomain, {summarize:{op:'extent',
        field:measure.field,
        as : measure.field}});

      yDomain = yDomain[measure.field];
      yDomain = exports.arrangeDomain(yDomain);
      return yDomain;
    };
    var __yScale = function (measure, stacked, dimensions, dimension) {
      var yDomain = __yDomain(measure, stacked, dimensions, dimension);
      scale.y = exports.mixedScale(yDomain) //TODO : domain 이 음수 사이에 있을 때 위에서 아래로 진행되도록 설정
        .round(true);
      if(orient === 'horizontal') {
        scale.y.rangeFromFrame([0,'width'], frame);
      } else {
        scale.y.rangeFromFrame([0,'height'], frame)
        .reverse(true);
      }
    };

    var stacked= exports.stacked();
    var measure;
    if(condition === 'normal' || condition ==='histogram') {
      if(condition === 'normal') {
        measure = measures[0];
      } else {
        measure = exports.defaultMeasureForCount();
      }
      if(dimensions.length === 2 ) {
        //두번째 변수로 color를 만듦
        if( stacked === false) {
          __regionScale(dimensions[0]); //grouped 인 경우
          __xScale(dimensions[1], true);
        } else {
          __xScale(dimensions[0], false); //stack 인 경우
        }
        __cScale(dimensions[1], false);
      } else { //mono 인 경우
        __cScale(dimensions[0], true);
        __xScale(dimensions[0], false);
      }
      __yScale(measure, stacked, dimensions, dimensions[0]);

    } else if(condition ==='mixed') { //grouped-stacked dimension 1 measure >2
      var dimension1 = defaultDimensionForMixed;
      dimensions = [dimensions[0]];
      dimensions.push(dimension1);
      measure = {field: '__melted_value__', op:'sum'};
      if (stacked === false) {
        __regionScale(dimensions[0]); //grouped
        __xScale(dimension1, true); //grouped

      } else {
        __xScale(dimensions[0], false); //stacked
      }
      __cScale(dimension1, false);
      __yScale(measure, stacked, dimensions,dimensions[0]);
    }
  } //end of _scale

  function _mark() {
    function __bar(dimension, measure, transform, stacked) {
      var bar = d3.daisy.mark()
        .type('rect')
        .name('bar');
      if(transform) bar.transform(transform); //frame.transform(stackTransform);

      var barEnter = {};
      if(orient==='horizontal') {
        barEnter = {
          y: {field:dimension.field, scale:scale.x},
          height : {scale: scale.x, band:true}
        };
        if(stacked) {
          barEnter.x2 = {field:'layout_start', scale:scale.y};
          barEnter.x =  {field:'layout_end', scale:scale.y};
        } else {
          barEnter.x = {value:scale.y.domain()[0], scale:scale.y};
          barEnter.width = {field:measure.field, scale:scale.y};
        }
      } else {
        barEnter = {
           x : {field:dimension.field, scale:scale.x},
           width : {scale:scale.x, band:true},
         };
        if(stacked) {
          barEnter.y = {field:'layout_start', scale:scale.y};
          barEnter.y2 =  {field:'layout_end', scale:scale.y};
        } else {
          barEnter.y = {field:measure.field, scale:scale.y};
          barEnter.height = {field:measure.field, scale:scale.y, mult:-1, offset:scale.y.range()[0]};
        }
      }

      var barHover = {
       fill : {value:exports.hoverColor()}
      };
      bar.enter(barEnter).hover(barHover);
      return bar;
    }
    function __monoBar(dimension, measure) {
      var aggTransform = d3.daisy.transform() // 내부에서 mean 값 접근 위해
          .transform({
            name :'aggregate',
            options: {groupby:dimension.field, summarize: {field:measure.field, op:measure.op, as:measure.field}}
          });

      mark.bar = __bar(dimension, measure, aggTransform);
      mark.bar.update({
        fill:{value:dimension.field, scale:scale.c}
      });
      frame.mark(mark.bar);
    }
    function __groupedBar(dimension0, dimension1, measure) {
      var facetTransform = d3.daisy.transform() // region 을 위해
        .transform(
          { name:'facet',
            options:{ groupby:dimension0.field, flatten:false}
          }
        );
      mark.region = d3.daisy.group()
        .name('region')
        .transform(facetTransform);//{key: values}

      if(orient === 'horizontal') {
        mark.region.enter({y:{field:dimension0.field, scale:scale.region}});
      } else {
        mark.region.enter({x:{field:dimension0.field, scale:scale.region}});
      }
        //x축 위치를 이동
      frame.mark(mark.region);

      var aggTransform = d3.daisy.transform() // 내부에서 mean 값 접근 위해
          .transform({
            name :'aggregate',
            options: {groupby:dimension1.field, summarize: {field:measure.field, op:measure.op, as:measure.field}}
          });
      mark.bar = __bar(dimension1, measure, aggTransform);
      mark.bar.update( {
       fill : {field:dimension1.field, scale:scale.c}
     });
      mark.region.mark(mark.bar);
    }
    var __stackedBar = function(dimension0, dimension1, measure) {
      var transform = d3.daisy.transform() // 내부에서 mean 값 접근 위해
          .transform({
            name :'aggregate',
            options: {groupby:[dimension0.field, dimension1.field], summarize: {field:measure.field, op:measure.op, as:measure.field}}
          }).transform(
          { name:'stack',
            options:{ groupby:[dimension1.field], field:measure.field, orderby:dimension0.field}
          }
        );
      frame.transform(transform);

      var barUpdate = {
       fill : {field:dimension1.field, scale:scale.c}
      };

      mark.bar = __bar(dimension0, measure, null, true);
      mark.bar.update(barUpdate);
      frame.mark(mark.bar);
    };

    var stacked= exports.stacked();
    var measure;
    if(condition === 'normal' || condition === 'histogram') {
      if(condition === 'normal') measure = measures[0];
      else measure = exports.defaultMeasureForCount();
      if(dimensions.length === 2 ) {
        //두번째 변수로 color를 만듦
        if( stacked) {
          __stackedBar(dimensions[0], dimensions[1], measure);
        } else {
          __groupedBar(dimensions[0], dimensions[1], measure);
        }
      } else { // mono 일때
        __monoBar(dimensions[0], measure);
      }
    } else if(condition ==='mixed') {
      measure = defaultMeasureForMixed;//{field:'__melted_value__', op: 'sum'};
      var dimension1 = defaultDimensionForMixed;
      if(stacked ) { //stacked
        __stackedBar(dimensions[0], dimension1, measure);
      } else { //grouped
        __groupedBar(dimensions[0], dimension1, measure);
      }
    }
  }

  function _axis() {
    var axes = exports.axes(),
      stacked= exports.stacked();
    if(!axes) return;
    var xAxis = axes.filter(function(d){return d.orient === 'x';});
    if(xAxis.length > 0) {
      xAxis = xAxis[0];
      axis.x = d3.daisy.axis()
        .name('x');
      if(orient === 'horizontal') {
        axis.x.orient('left');
      } else {
        axis.x.y('height');
      }
      if((condition === 'mixed' || dimensions.length === 2) &&stacked === false) {//grouped
        axis.x.scale(scale.region);
      } else { // stack 이나 mono 일때
        axis.x.scale(scale.x);
      }
      frame.axis(axis.x);
    }
    var yAxis = axes.filter(function(d){return d.orient === 'y';});
    if(yAxis.length > 0) {
      axis.y = d3.daisy.axis()
        .scale(scale.y)
        .name('y');
      if(orient ==='horizontal') {
        axis.y.y('height');
      } else {
        axis.y.orient('left');
      }
      frame.axis(axis.y);
    }
  }

  function _legend() {
    if(!legend) return;
    legend.scale(scale.c);
  }
  function _tooltip() {
    if(!exports.tooltip()) return;
    var tooltip = d3.daisy.tooltip();
    var measure, dimension;
    if(condition === 'normal') {
      measure = measures[0];
    } else if (condition === 'mixed'){
      measure = defaultMeasureForMixed;
    } else {
      measure = exports.defaultMeasureForCount();
    }
    tooltip.valueField(measure.field);
    if(dimensions.length === 2 || condition === "mixed") {
      if(condition === 'mixed') {
        dimension = defaultDimensionForMixed;
      } else {
        dimension = dimensions[1];
      }
      tooltip.keyField(dimension.field);
      if(exports.stacked()) { //stacked
        dimension = dimensions[0];
        if(orient ==='horizontal') {
          tooltip.update({y:{field:dimension.field, scale:scale.x},
            x:{field:'layout_start', scale:scale.y}});
        } else {
          tooltip.update({x:{field:dimension.field, scale:scale.x},
            y:{field:'layout_start', scale:scale.y}});
        }
        frame.tooltip(tooltip);
      } else { //grouped
        if(orient ==='horizontal') {
          tooltip.update({y:{field:dimension.field, scale:scale.x},
            x:{field:measure.field, scale:scale.y}});
        } else {
          tooltip.update({x:{field:dimension.field, scale:scale.x},
            y:{field:measure.field, scale:scale.y}});
        }

        mark.region.tooltip(tooltip);
      }
    } else { //mono
      dimension = dimensions[0];
      tooltip.keyField(dimension.field);
      if(orient ==='horizontal') {
        tooltip.update({y:{field:dimension.field, scale:scale.x},
          x:{field:measure.field, scale:scale.y}});
      } else {
        tooltip.update({x:{field:dimension.field, scale:scale.x},
          y:{field:measure.field, scale:scale.y}});
      }

      frame.tooltip(tooltip);
    }

    mark.bar.on('mouseenter', function(d) {
      tooltip.show(d3.select(this));
    });
    mark.bar.on('mouseleave', function(d) {
      tooltip.hide(d3.select(this));
    });
  }

  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.line = function() {
  var attrs = {};
  var defaultDimensionForMixed = {field : '__melted_key__', order:'natural'},
    defaultMeasureForMixed = {field : '__melted_value__', op:'mean'},
    defaultColor = d3.daisy.default.schemeCategory10();
  var frame, condition, legend, data, curve, dimensions, measures;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['histogram', 'normal', 'mixed'];

  var exports = d3.daisy.layout.default();
  _init();
  function _init() {
    exports._frame = _frame;
    exports._condition = _condition;
    exports._scale = _scale;
    exports._axis = _axis;
    exports._mark = _mark;
    exports._legend = _legend;
    exports._tooltip = _tooltip;
    exports._render = _render;
  }
  function _render() {
    frame.render();
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(dimensions.length === 0 ) {
      exports.conditionException();  // TODO : error를 내보낸다.
    }

    if(measures.length === 0) {
      if(dimensions.length <= 2) {
        condition = 'histogram';
      } else {
        //TODO : throw error
        exports.conditionException();
      }
    } else if (measures.length === 1) {
      if(dimensions.length <= 2) {
        condition = 'normal';
      } else {
        //TODO : throw error
        exports.conditionException();
      }
    } else {
      if(dimensions.length === 1) {
        condition = 'mixed';
      } else {
        //TODO : throw error
        exports.conditionException();
      }
    }
    curve = exports.curve() || 'linear';
  }

  function _frame() {
    data = exports.data();

    if(condition === 'mixed') { //mixed 인 경우 데이터 형태를 선변환
      data = d3.daisy.transformMethods() //measure의 op에 따라 aggregate 해야하므로 aggregate를 선행
        .aggregate(data,
          {summarize:measures.map(function(d) {
            d.as = d.field;
            return d;
          }),
            groupby:dimensions.map(function(d){return d.field;})
          });
      data = d3.daisy.transformMethods()
        .melt(data,
          {groupby:dimensions.map(function(d){return d.field;}),
            field:measures.map(function(d){return d.field;})
          });
    }
    dimensions.forEach(function(dimension,i) {
      var sample = data[0][dimension.field];
      if(i === 0 && typeof sample === 'number') {
        //pass
      } else {
        data = exports.limit(data, dimension);
      }
    });
    frame = d3.daisy.frame()
      .container(exports.container())
      .width(exports.width()).height(exports.height())
      .margin(exports.margin())
      .data(data);
    var legendSetting = exports.legend();
    if(legendSetting) { //FIXME: 현재는 미리 legend를 설정해둬야함
      legend = d3.daisy.legend();
      if(typeof legendSetting === 'object') {
        legend.orient(legendSetting.orient);
      } else {
        legend.orient(exports.defaultLegend().orient);
      }
      frame.legend(legend);
    }
  }

  function _scale() { //set scale
    var __xScale = function(dimension) {
      var xDomain = d3.daisy.transformMethods()
        .set(data, {field:[dimension.field]});
      if(dimension.order === 'natural') dimension.order = 'ascending';
      xDomain = exports.sort(xDomain, dimension.order);
      scale.x = exports.mixedScale(xDomain)
      .round(true)
      .padding(0.05)
      .rangeFromFrame([0,'width'], frame);
    };

    var __cScale = function(dimension, mono) {

      var cDomain;
      if(!mono) {
        cDomain = d3.daisy.transformMethods()
          .set(data, {field:dimension.field});
      } else {
        cDomain = [dimension.field];
      }
      scale.c = exports.ordinalCScale(cDomain, defaultColor);
       //FIXME : domain 개수에 따라 카테고리 개수 변화
    };

    var __yDomain = function(measure, stacked, dimensions, dimension0) {
      var yDomain = d3.daisy.transformMethods()
        .aggregate(data,
          {summarize:{field:measure.field, op:measure.op, as:measure.field},
            groupby:dimensions.map(function(d){return d.field;})
          });

      if(stacked) {
        var extent = d3.daisy.transformMethods()
          .aggregate(yDomain,
            {summarize:{field:measure.field, op:'sum', as:measure.field},
              groupby:[dimension0.field] //FIXME dimension을 가리키도록 수정
            });
        yDomain = yDomain.concat(extent);
      }

      yDomain = d3.daisy.transformMethods()
        .aggregate(yDomain, {summarize:{op:'extent',
        field:measure.field,
        as : measure.field}});

      yDomain = yDomain[measure.field];
      yDomain = exports.arrangeDomain(yDomain);
      return yDomain;
    };
    var __yScale = function (measure, stacked, dimensions, dimension) {
      var yDomain = __yDomain(measure, stacked, dimensions, dimension);
      scale.y = exports.mixedScale(yDomain) //TODO : domain 이 음수 사이에 있을 때 위에서 아래로 진행되도록 설정
        .rangeFromFrame([0,'height'], frame)
        .reverse(true)
        .round(true);
    };

    var stacked= exports.stacked();
    var measure;
    if(condition === 'normal' || condition ==='histogram') {
      if(condition === 'normal') {
        measure = measures[0];
      } else {
        measure = exports.defaultMeasureForCount();
      }
      if(dimensions.length === 2 ) {
        //두번째 변수로 color를 만듦
        if( stacked === false) {
          __xScale(dimensions[0], true);
        } else {
          __xScale(dimensions[0], false); //stack 인 경우
        }
        __cScale(dimensions[1], false);
      } else { //mono 인 경우
        __cScale(dimensions[0], true);
        __xScale(dimensions[0], false);
      }
      __yScale(measure, stacked, dimensions, dimensions[0]);

    } else if(condition ==='mixed') { //grouped-stacked dimension 1 measure >2
      var dimension1 = defaultDimensionForMixed;
      dimensions = [dimensions[0]];
      dimensions.push(dimension1);
      measure = defaultMeasureForMixed;
      if (stacked === false) {
        __xScale(dimensions[0], true); //grouped
      } else {
        __xScale(dimensions[0], false); //stacked
      }
      __cScale(dimension1, false);
      __yScale(measure, stacked, dimensions,dimensions[0]);
    }
  } //end of _scale

  function _mark() {
    function __point(dimension, measure, transform, stacked) {
      var point = d3.daisy.mark()
        .type('circle')
        .name('point');
      if(transform) point.transform(transform);
      var pointEnter = {
          x : {field:dimension.field, scale:scale.x},
          r: {value:4},
        };
      if(stacked) {
        pointEnter.y = {field:'layout_start', scale:scale.y};
      } else {
        pointEnter.y = {field:measure.field, scale:scale.y};
      }
      point.enter(pointEnter).hover({
          fillOpacity :{value:1.0}
        });
      return point;
    }
    function __line(dimension, measure, transform, stacked) {
      var line = d3.daisy.mark()
        .type('line')
        .name('line');

      if(transform) line.transform(transform); //frame.transform(stackTransform);
      var lineEnter = {
         x : {field:dimension.field, scale:scale.x},
         strokeWidth : '2px',
         strokeLinejoin :'round',
         fill:'none'
       };
       if(stacked) {
         lineEnter.y = {field:'layout_start', scale:scale.y};
       } else {
         lineEnter.y =  {field:measure.field, scale:scale.y};
       }
      line.enter(lineEnter);
      return line;
    }
    function __area(dimension, measure, transform, stacked) {
      var area = d3.daisy.mark()
        .type('area')
        .name('area');

      if(transform) area.transform(transform); //frame.transform(stackTransform);
      var areaEnter = {
         x : {field:dimension.field, scale:scale.x}
       };
      if(stacked) {
        areaEnter.y =  {field:'layout_start', scale:scale.y};
        areaEnter.y2 = {field:'layout_end', scale:scale.y};
      } else {
        areaEnter.y =  {field:measure.field, scale:scale.y};
        areaEnter.y2 = {value:0, scale:scale.y};
      }
      area.enter(areaEnter);
      return area;
    }
    function _monoLine(dimension, measure) {
      var aggTransform = d3.daisy.transform() // 내부에서 mean 값 접근 위해
          .transform({
            name :'aggregate',
            options: {groupby:dimension.field, summarize: {field:measure.field, op:measure.op, as:measure.field}}
          });
      if(exports.shape() === 'area') {
        mark.area = __area(dimension, measure, aggTransform, false);
        mark.area.update( {
         fill:{value:dimension.field, scale:scale.c},
         fillOpacity:{value:0.5},
         curve : curve
        });
        frame.mark(mark.area);
      }
      mark.line = __line(dimension, measure, aggTransform);
      mark.line.update({
        stroke:{value:dimension.field, scale:scale.c},
        curve : curve
      });
      frame.mark(mark.line);
      mark.point = __point(dimension, measure, aggTransform);
      mark.point.update( {
         fill : {value:dimension.field, scale:scale.c},
         fillOpacity :{value:0}
       });
      frame.mark(mark.point);
    }
    function __groupedLine(dimension0, dimension1, measure) {

      var facetTransform = d3.daisy.transform() // region 을 위해
        .transform(
          { name:'facet',
            options:{ groupby:dimension1.field, flatten:false}
          }
        );
      mark.region = d3.daisy.group()
        .name('region')
        .transform(facetTransform); //{key: values}
        //x축 위치를 이동
      frame.mark(mark.region);

      var aggTransform = d3.daisy.transform() // 내부에서 mean 값 접근 위해
          .transform({
            name :'aggregate',
            options: {groupby:[dimension1.field, dimension0.field], summarize: {field:measure.field, op:measure.op, as:measure.field}}
          }); //dimension1을 유지하기 위해 추가함
      if(exports.shape() === 'area') {
        mark.area = __area(dimension0, measure, aggTransform, false);
        mark.area.update( {
         fill : {field:dimension1.field, scale:scale.c},
         fillOpacity:{value:0.5},
         curve : curve
        });
        mark.region.mark(mark.area);
      }
      mark.line = __line(dimension0, measure, aggTransform);
      mark.line.update( {
       stroke : {field:dimension1.field, scale:scale.c},
       curve : curve
      });
      mark.region.mark(mark.line);
      mark.point = __point(dimension0, measure, aggTransform);
      mark.point.update( {
         fill : {field:dimension1.field, scale:scale.c},
         fillOpacity :{value:0},
       });
      mark.region.mark(mark.point);
    }
    var __stackedLine = function(dimension0, dimension1, measure) {

      var transform = d3.daisy.transform() // 내부에서 mean 값 접근 위해
          .transform({
            name :'aggregate',
            options: {groupby:[dimension0.field, dimension1.field], summarize: {field:measure.field, op:measure.op, as:measure.field}}
          }).transform(
          { name:'stack',
            options:{ groupby:[dimension1.field], field:measure.field, orderby:dimension0.field}
          }
        );
      frame.transform(transform);
      var facetTransform = d3.daisy.transform() .transform(
        {name:'facet', options:{groupby:dimension1.field}}
      );
      mark.region = d3.daisy.group()
        .transform(facetTransform)
        .key(dimension1.field);
      frame.mark(mark.region);
      if(exports.shape() === 'area') {
        mark.area = __area(dimension0, measure, null, true);
        mark.area.update( {
         fill : {field:dimension1.field, scale:scale.c},
         fillOpacity:{value:0.5},
         curve : curve
        });
        mark.region.mark(mark.area);
      }
      var lineUpdate = {
       stroke : {field:dimension1.field, scale:scale.c},
       curve : curve
      };
      mark.line = __line(dimension0, measure, null, true);
      mark.line.update(lineUpdate);
      mark.region.mark(mark.line);
      mark.point = __point(dimension0, measure, null, true);
      mark.point.update( {
         fill : {field:dimension1.field, scale:scale.c},
         fillOpacity :{value:0},
       });
      mark.region.mark(mark.point);
    };

    var stacked= exports.stacked();
    var measure;
    if(condition === 'normal' || condition === 'histogram') {
      if(condition === 'normal') measure = measures[0];
      else measure = exports.defaultMeasureForCount();
      if(dimensions.length === 2 ) {
        //두번째 변수로 color를 만듦
        if( stacked) {
          __stackedLine(dimensions[0], dimensions[1], measure);
        } else {
          __groupedLine(dimensions[0], dimensions[1], measure);
        }
      } else { // mono 일때
        _monoLine(dimensions[0], measure);
      }
    } else if(condition ==='mixed') {
      measure = defaultMeasureForMixed;//{field:'__melted_value__', op: 'sum'};
      var dimension1 = defaultDimensionForMixed;//{field: '__melted_key__', order: 'natural'};
      if(stacked ) { //stacked
        __stackedLine(dimensions[0], dimension1, measure);
      } else { //grouped
        __groupedLine(dimensions[0], dimension1, measure);
      }
    }
  }

  function _axis() {
    var axes = exports.axes(),
      stacked= exports.stacked();
    if(!axes) return;
    var xAxis = axes.filter(function(d){return d.orient === 'x';});
    if(xAxis.length > 0) {
      xAxis = xAxis[0];
      axis.x = d3.daisy.axis()
        .name('c')
        .y('height');
      axis.x.scale(scale.x);
      frame.axis(axis.x);
    }
    var yAxis = axes.filter(function(d){return d.orient === 'y';});
    if(yAxis.length > 0) {
      axis.y = d3.daisy.axis()
        .scale(scale.y)
        .name('y')
        .orient('left');
        frame.axis(axis.y);
      }
  }

  function _legend() {
    if(!exports.legend()) return;
    legend.scale(scale.c);
  }
  function _tooltip() {
    if(!exports.tooltip()) return;
    var tooltip = d3.daisy.tooltip();

    var measure, dimension;
    if(condition === 'normal') {
      measure = measures[0];
    } else if (condition === 'mixed'){
      measure = defaultMeasureForMixed;
    } else {
      measure = exports.defaultMeasureForCount();
    }
    tooltip.valueField(measure.field);
    if(dimensions.length === 2 || condition === "mixed") {
      dimension = dimensions[0];
      tooltip.keyField(dimension.field);
      if(exports.stacked()) { //stacked
        tooltip.update({x:{field:dimension.field, scale:scale.x},
        y:{field:'layout_start', scale:scale.y}});
        frame.tooltip(tooltip);
      } else { //grouped
        tooltip.update({x:{field:dimension.field, scale:scale.x, offset:8},
        y:{field:measure.field, scale:scale.y}});
        frame.tooltip(tooltip);
      }
    } else { //mono
      dimension = dimensions[0];
      tooltip.keyField(dimension.field);
      tooltip.update({x:{field:dimension.field, scale:scale.x, offset:8},
      y:{field:measure.field, scale:scale.y}});
      frame.tooltip(tooltip);
    }

    mark.point.on('mouseenter', function(d) {
      tooltip.show(d3.select(this));
    });
    mark.point.on('mouseleave', function(d) {
      tooltip.hide(d3.select(this));
    });

  }

  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.scatter = function() {
  var attrs = {};
  var defaultSize = {range:[3, 12], scale:'linear', reverse:false},
    defaultColor = d3.daisy.default.schemeCategory10();
  var frame, condition, legend, data, measures, dimensions;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['normal', 'color', 'bubble', 'mixed'];

  var exports = d3.daisy.layout.default();
  _init();
  function _init() {
    exports._frame = _frame;
    exports._condition = _condition;
    exports._scale = _scale;
    exports._axis = _axis;
    exports._mark = _mark;
    exports._legend = _legend;
    exports._tooltip = _tooltip;
    exports._render = _render;
  }
  function _render() {
    frame.render();
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(measures.length < 2 ) {
      exports.conditionException();   // TODO : error를 내보낸다.
    }
    if(dimensions.length === 1 && measures.length === 3) {
      condition =  'mixed';
    } else if (dimensions.length ===1) {
      condition = 'color';
    } else if (measures.length === 3) {
      condition = 'bubble';
    } else if (measures.length === 2) {
      condition = 'normal';
    } else {
      exports.conditionException();
    }
  }

  function _frame() {
    data = exports.data();
    if(dimensions.length >= 1) {
      dimensions.forEach(function(dimensions) {
        data = exports.limit(data, dimensions);
      });
    }
    frame = d3.daisy.frame()
      .container(exports.container())
      .width(exports.width()).height(exports.height())
      .margin(exports.margin())
      .data(data);
    var legendSetting = exports.legend();
    if((condition === 'color' || condition === 'mixed') && legendSetting) { //FIXME: 현재는 미리 legend를 설정해둬야함
      legend = d3.daisy.legend(); // dimension이 있는 경우에만 legend 사용 가능
      if(typeof legendSetting === 'object') {
        legend.orient(legendSetting.orient);
      } else {
        legend.orient(exports.defaultLegend().orient);
      }
      frame.legend(legend);
    }
  }

  function _scale() { //set scale

    var __xScale = function(dimension) {
      var xDomain = d3.daisy.transformMethods()
        .set(data, {field:[dimension.field]});
      xDomain = exports.sort(xDomain, dimension.order);
      scale.x = exports.mixedScale(xDomain)
      .round(true)
      .padding(0.05)
      .rangeFromFrame([0,'width'], frame);
    };

    var __cScale = function(dimension) {
      var cDomain = d3.daisy.transformMethods()
         .set(data, {field:dimension.field});
      scale.c = exports.ordinalCScale(cDomain, defaultColor);
    };

    var __yDomain = function(measure) {
      var yDomain =  d3.daisy.transformMethods()
        .aggregate(data,
          {summarize:{op:'extent',field:measure.field, as : measure.field}});
      yDomain = yDomain[measure.field];
      return yDomain;
    };
    var __yScale = function (measure) {
      var yDomain = __yDomain(measure);
      scale.y = exports.mixedScale(yDomain)//TODO : domain 이 음수 사이에 있을 때 위에서 아래로 진행되도록 설정
        .rangeFromFrame([0,'height'], frame)
        .reverse(true)
        .round(true);
    };
    var __rScale = function (measure) {
      var size = exports.size();
      if(!size) size = defaultSize;
      var rDomain =  d3.daisy.transformMethods()
        .aggregate(data,
          {summarize:{op:'extent',field:measure.field, as : measure.field}});
      rDomain = rDomain[measure.field];
      scale.r = d3.daisy.scale().type(size.scale)
        .domain(rDomain) //TODO : domain 이 음수 사이에 있을 때 위에서 아래로 진행되도록 설정
        .range(size.range)
        .reverse(size.reverse);
    };

    __xScale(measures[0]);
    __yScale(measures[1]);
    if(condition==='mixed' || condition==='color') {
      __cScale(dimensions[0]);
    }
    if(condition==='mixed' || condition==='bubble') {
      __rScale(measures[2]);
    }
  } //end of _scale

  function _mark() {
    var c = d3.daisy.default.schemeCategory10()[0];

    mark.point = d3.daisy.mark()
      .type('circle')
      .name('point');

    var pointUpdate = {
        x : {field:measures[0].field, scale:scale.x},
        y : {field:measures[1].field, scale:scale.y},
        r : {value:defaultSize.range[0]},
        fillOpacity : 0.5,
        fill : {value:c},
        stroke : {value:c}
      };
    if(condition==='mixed' || condition === 'color') {
      pointUpdate.fill = {field:dimensions[0].field, scale:scale.c};
      pointUpdate.stroke = {field:dimensions[0].field, scale:scale.c};
    }

    if (condition==='mixed' || condition === 'bubble') {
      pointUpdate.r = {field:measures[2].field, scale:scale.r};
    }

    mark.point.enter({
      strokeWidth : 1
    }).update(pointUpdate)
      .hover({
          fillOpacity :{value:1.0}
        });
    frame.mark(mark.point);
  }

  function _axis() {
    var axes = exports.axes();
    if(!axes) return;
    var xAxis = axes.filter(function(d){return d.orient === 'x';});
    if(xAxis.length > 0) {
      xAxis = xAxis[0];
      axis.x = d3.daisy.axis()
        .name('c')
        .y('height');
      axis.x.scale(scale.x);
      frame.axis(axis.x);
    }
    var yAxis = axes.filter(function(d){return d.orient === 'y';});
    if(yAxis.length > 0) {
      axis.y = d3.daisy.axis()
        .scale(scale.y)
        .name('y')
        .orient('left');
      frame.axis(axis.y);
    }
  }

  function _legend() {
    if(!legend) return;
    legend.scale(scale.c);
  }
  function _tooltip() {
    if(!exports.tooltip()) return;
    var tooltip = d3.daisy.tooltip().moveToFront(false);
    tooltip.keyField(measures[0].field).valueField(measures[1].field)
      .update({
        x:{field:measures[0].field, scale:scale.x, offset:defaultSize.range[0]*2},
        y:{field:measures[1].field, scale:scale.y}
      });
    mark.point.on('mouseenter', function(d) {
      tooltip.show(d3.select(this));
    });
    mark.point.on('mouseleave', function(d) {
      tooltip.hide(d3.select(this));
    });

  }

  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.parCoords = function() {
  var attrs = {};
  var frame, condition, legend, data, dimensions, measures;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['normal', 'color'];
  var defaultColor = d3.daisy.default.schemeCategory20();

  var exports = d3.daisy.layout.default();
  _init();
  function _init() {
    exports._frame = _frame;
    exports._condition = _condition;
    exports._scale = _scale;
    exports._axis = _axis;
    exports._mark = _mark;
    exports._legend = _legend;
    exports._tooltip = _tooltip;
    exports._render = _render;
  }
  function _render() {
    frame.render();
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(measures.length < 2 ) {
      exports.conditionException(); // TODO : error를 내보낸다.
    }
    if(dimensions.length > 1) {
      exports.conditionException() ; // TODO : error를 내보낸다.
    }

    if(dimensions.length === 1) {
      condition = 'color';
    } else {
      condition = 'normal';
    }
  }

  function _frame() {
    data = exports.data();
    if(dimensions.length >= 1) {
      dimensions.forEach(function(dimensions) {
        data = exports.limit(data, dimensions);
      });
    }
    frame = d3.daisy.frame()
      .container(exports.container())
      .width(exports.width()).height(exports.height())
      .margin(exports.margin())
      .data(data);
    var legendSetting = exports.legend();
    if(condition == 'color' && legendSetting) { //FIXME: 현재는 미리 legend를 설정해둬야함
      legend = d3.daisy.legend();
      if(typeof legendSetting === 'object') {
        legend.orient(legendSetting.orient);
      } else {
        legend.orient(exports.defaultLegend().orient);
      }
      frame.legend(legend);
    }
  }

  function _scale() { //set scale
    var __simpleXScale = function(xDomain) {
      var x = d3.daisy.scale().type('point')
        .domain(xDomain)
        .round(true)
        .padding(0.05)
        .rangeFromFrame([0,'width'], frame);
      scale.x = x;
    };
    var __xScale = function(measures) {
      var xDomain = measures.map(function(d){return d.field;});
      __simpleXScale(xDomain);
    };
    var __cScale = function(dimension) {
      var cDomain = d3.daisy.transformMethods()
          .set(data, {field:dimension.field});
      cDomain = exports.sort(cDomain, dimension.order);
      scale.c = exports.ordinalCScale(cDomain, defaultColor);
    };

    var __yDomain = function(measure, dimension) {
      var yDomain = data;
      if(dimension) {
        yDomain = d3.daisy.transformMethods()
          .aggregate(yDomain,
          {summarize:{field:measure.field, op:measure.op, as:measure.field},
            groupby:dimension.field
          });
      }
      yDomain = d3.daisy.transformMethods()
        .aggregate(yDomain, {summarize:{op:'extent',
        field:measure.field,
        as : measure.field}});

      yDomain = yDomain[measure.field];
      return yDomain;
    };
    var __yScale = function (measure, dimension) {
      var yDomain = __yDomain(measure, dimension);
      scale['scale_y_' + measure.field] = exports.mixedScale(yDomain)
        .rangeFromFrame([0,'height'], frame)
        .reverse(true)
        .round(true);
    };
    var dimension;
    if(condition == 'color') {
      dimension = dimensions[0];
      __cScale(dimension);
    }
    __xScale(measures);
    measures.forEach(function(m) {
      __yScale(m, dimension);
    });
  } //end of _scale

  function _mark() {
    var transform = d3.daisy.transform();
    var lineUpdate = {
      stroke:{value:d3.daisy.default.schemeCategory10()[0]},
      strokeWidth:{value:'1px'},
      x:{field:'layout_key', scale:scale.x},
      y:{field:'layout_scaled_value'} //FIXME: 현재는 미리 스케일링을 하지만, scale을 변형할 수 있는 옵션을 주어야함
    };

    if(condition === 'color') {
      var dimension = exports.dimensions()[0];
      var options = { groupby:dimension.field };
      options.summarize = measures.map(function(m){
        m.as = m.field;
        return m;
      });
      transform.transform({
        name:'aggregate',
        options : options
      });
      lineUpdate.stroke = {field:dimension.field, scale:scale.c};
    }
    transform.transform({
      name: 'parCoords',
      options: {groupby:scale.x.domain(), scale:scale}
    });
    frame.transform(transform);
    mark.region = d3.daisy.group()
      .name('region');
    frame.mark(mark.region);
    mark.line = d3.daisy.mark()
      .type('line')
      .name('line');

    mark.line.enter({
      fill:'none',
    }).update(lineUpdate);
    mark.region.mark(mark.line);
  }

  function _axis() { //axis가 강제로 표시

    //yAxis는 다수
    //xAxis는 xScale로
    var axes = exports.axes();
    if(!axes) return;
    var xAxis = axes.filter(function(d){return d.orient === 'x';});
    if(xAxis.length > 0) {
      xAxis = xAxis[0];
      axis.x = d3.daisy.axis()
        .name('c')
        .y('height');
      axis.x.scale(scale.x);
      frame.axis(axis.x);
    }
    var yAxis = axes.filter(function(d){return d.orient === 'y';});
    if(yAxis.length > 0) {
      measures.forEach(function(m) {
        var axisName = ['scale_y_' + m.field];
        axis[axisName] = d3.daisy.axis()
          .scale(scale[axisName])
          .name(axisName)
          .x(scale.x(m.field))
          .orient('left');
        frame.axis(axis[axisName]);
      });
    }
  }

  function _legend() {
    if(!legend) return;
    legend.scale(scale.c);
  }
  function _tooltip() { //FIXME 선 선택시에도 확인 가능 해야함 : datum이 array 일때 값과 위치(커서에) 가능해야함
    if(!exports.tooltip() || condition==='normal') return;
  }

  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.pie = function() {
  var attrs = {};
  var defaultSize = {range:[0, 150], scale:'linear', reverse:false}, // 크기로 사용
    defaultColor = d3.daisy.default.schemeCategory20();
  var frame, condition, legend, data, dimensions, measures;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['normal', 'histogram'];

  var exports = d3.daisy.layout.default();
  exports.dimensionMax(40); // 미리 개수를 줄여둠
  _init();
  function _init() {
    exports._frame = _frame;
    exports._condition = _condition;
    exports._scale = _scale;
    exports._mark = _mark;
    exports._legend = _legend;
    exports._tooltip = _tooltip;
    exports._render = _render;
  }
  function _render() {
    frame.render();
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(dimensions.length < 1 ) {
      exports.conditionException();   // TODO : error를 내보낸다.
    }
    if(dimensions.length === 1) {
      if(measures.length === 1) {
        condition = 'normal';
      } else if(measures.length === 0) {
        condition = 'histogram';
      } else {
        exports.conditionException();
      }
    } else {
      exports.conditionException();
    }
  }

  function _frame() {
    data = exports.data();
    dimensions.forEach(function(dimensions) {
      data = exports.limit(data, dimensions);
    });

    frame = d3.daisy.frame()
      .container(exports.container())
      .width(exports.width()).height(exports.height())
      .margin(exports.margin())
      .data(data);
    var legendSetting = exports.legend();
    if(legendSetting) { //FIXME: 현재는 미리 legend를 설정해둬야함
      legend = d3.daisy.legend(); // dimension이 있는 경우에만 legend 사용 가능
      if(typeof legendSetting === 'object') {
        legend.orient(legendSetting.orient);
      } else {
        legend.orient(exports.defaultLegend().orient);
      }
      frame.legend(legend);
    }
  }

  function _scale() { //set scale
    var __cScale = function(dimension) {
      var cDomain = d3.daisy.transformMethods()
         .set(data, {field:dimension.field});
      cDomain = exports.sort(cDomain, dimension.order);
      scale.c = exports.ordinalCScale(cDomain, defaultColor);
    };

    var dimension = exports.dimensions()[0];
    __cScale(dimension);
  } //end of _scale

  function _mark() {
    var size = exports.size();
    if(!size) size = defaultSize;
    mark.pie = d3.daisy.mark()
      .type('arc')
      .name('pie');
    var transform = d3.daisy.transform();
    var measure, dimension = dimensions[0];
    if(condition==='normal') {
      measure = measures[0];
    } else {
      measure = exports.defaultMeasureForCount();
    }
    transform.transform({
      name:'aggregate',
      options: {groupby:dimension.field, summarize:{field:measure.field, op:measure.op, as:measure.field }}
    });
    if(dimension.order !== 'natural') {
      transform.transform({
        name:'sort',
        options:{orderby:dimension.field, order:dimension.order}
      });
    } else {
      transform.transform({
        name:'sort',
        options:{orderby:dimension.field, orderList:scale.c.domain()}
      });
    }
    transform.transform({
      name:'pie', options:{field:measure.field}
    });

    mark.pie.enter({
      x: {value : frame.innerWidth()*0.5},
      y: {value : frame.innerHeight()*0.5},
      innerRadius :{value:size.range[0]},
      outerRadius :{value:size.range[1]}
    }).update({
      startAngle : {field:'layout_start'},
      endAngle : {field:'layout_end'},
      fill : {field:dimensions[0].field, scale:scale.c}
    });
    frame.transform(transform).mark(mark.pie);
  }

  function _legend() {
    if(!legend) return;
    legend.scale(scale.c);
  }
  function _tooltip() {
    if(!exports.tooltip()) return;
    var tooltip = d3.daisy.tooltip().moveToFront(false).center(true);

    var size = exports.size();
    if(!size) size = defaultSize;
    var measure;
    if(condition==='normal') {
      measure = measures[0];
    } else {
      measure = exports.defaultMeasureForCount();
    }
    var halfPie = Math.PI*0.5,
    sizeMean = d3.mean(size.range),
    halfW = frame.innerWidth()*0.5,
    halfH = frame.innerHeight()*0.5;
    tooltip.keyField(dimensions[0].field).valueField(measure.field)
      .update({
        x:{callback: function(d) {
          return Math.cos(d.layout_middle-halfPie) * sizeMean + halfW;
        }},
        y:{callback: function(d) {
          return Math.sin(d.layout_middle-halfPie) * sizeMean + halfH;
        }}
      });
    //(startAngle + endAngle) / 2 and (innerRadius + outerRadius) /
    mark.pie.on('mouseenter', function(d) {
      tooltip.show(d3.select(this));
    });
    mark.pie.on('mouseleave', function(d) {
      tooltip.hide(d3.select(this));
    });

  }

  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.treemap = function() {
  var attrs = {};
  var frame, condition, legend, data, shape, dimensions, measures;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['histogram', 'normal'];
  var leafNodeDepth = 0;
  var font = d3.daisy.default.font();
  var defaultColor = d3.daisy.default.schemeLinear2();

  var exports = d3.daisy.layout.default();
  _init();
  function _init() {
    exports._frame = _frame;
    exports._condition = _condition;
    exports._scale = _scale;
    exports._mark = _mark;
    exports._tooltip = _tooltip;
    exports._render = _render;
  }
  function _render() {
    frame.render();
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(dimensions.length === 0 ) {
      exports.conditionException(); // TODO : error를 내보낸다.
    }

    if(measures.length === 0) {
      condition = 'histogram';
    } else if (measures.length === 1) {
      condition = 'normal';
    } else {
      exports.conditionException();
    }
    leafNodeDepth = dimensions.length;
    shape = exports.shape() || 'treemap';
  }

  function _frame() {
    var measure;
    if(condition === 'histogram') {
      measure = exports.defaultMeasureForCount();
    } else {
      measure = measures[0];
    }
    data = exports.data();
    if(dimensions.length >= 1) {
      dimensions.forEach(function(dimensions) {
        data = exports.limit(data, dimensions);
      });
    }
    data = d3.daisy.transformMethods()
      .aggregate(data, {
        groupby:dimensions.map(function(d){return d.field;}),
        summarize:{field:measure.field, op:measure.op, as:measure.field}
      });

    frame = d3.daisy.frame()
      .container(exports.container())
      .width(exports.width()).height(exports.height())
      .margin(exports.margin())
      .data(data);
  }

  function _scale() { //set scale
    var __cScale = function(dimensions, measure) {
      var cDomain = d3.daisy.transformMethods()
        .aggregate(data, {summarize:{field:measure.field, op:'extent', as:'extent'}});
      cDomain = cDomain.extent;
      scale.c = exports.linearCScale(cDomain, defaultColor);
    };
    var measure;
    if(condition === 'histogram') {
      measure = exports.defaultMeasureForCount();
    } else {
      measure = measures[0];
    }
    __cScale(dimensions, measure);
  } //end of _scale
  function _treemapMark(measures, dimensions, measure) {
    var labelHeight = 18;
    var transform = d3.daisy.transform()
      .transform({
        name:'facet',
        options:{
          flatten:false,
          groupby:dimensions.map(function(d){return d.field;})
        }})
      .transform({
        name:'treemap',
        options: {
          size:[frame.innerWidth(),frame.innerHeight()],
          isRoot:false, //root가 없이 시작한다
          children:'values',
          field:measure.field,
          round:true, paddingTop:labelHeight, padding:1
        }});
    frame.transform(transform);
    var lastRegion = frame;
    var labelOffset = 20;
    dimensions.forEach(function(dimension,i) {
       if(i+1 === leafNodeDepth) {
        mark.node = d3.daisy.mark()
          .type('rect')
          .name('leaf node')
          .update({
            x:{field:'x0'}, x2:{field:'x1'},
            y:{field:'y0'}, y2:{field:'y1'},
            fill:{field:'value', scale:scale.c}
          })
          .hover({ill : {value:exports.hoverColor()}});
        mark.label = d3.daisy.mark()
          .type('text')
          .name('leaf label')
          .enter({
            text:{callback:function(d){return d.data.key;}},
            fontFamily:font.fontFamily,
            fontSize:font.fontSize,
            fontWeight:font.fontWeight,
            dx:'2px',
            dy:'1em',
            pointerEvents:'none',
          }).update({
            x:{field:'x0'}, x2:{field:'x1'},
            y:{field:'y0'}, y2:{field:'y1'},
            opacity : {callback:function(d) {
              var width  = this.getBBox().width;
              if(d.x1 - d.x0  <= width +2) return 0;
              else if(d.y1-d.y0 <= labelOffset-2) return 0;
              else return 1;
            }}
          });
        lastRegion.mark(mark.node);
        lastRegion.mark(mark.label);
      } else if(i+1 < leafNodeDepth) {
         //region
         var regionName = 'region_'+(i),
         labelName = 'node_'+(i)+'_label', rectName = 'node_'+(i)+'_rect';
         mark[regionName] = d3.daisy.group()
          .name('node')
          .field('children'); // 평소에는 values이나 tree구조는 children 사용
         mark[labelName] = d3.daisy.mark()
          .type('text')
          .name('label')
          .enter({
            text:{callback:function(d){return d.data.key;}},
            fontFamily:font.fontFamily,
            fontSize:font.fontSize,
            dx:'2px',
            dy:'1em',
            fontWeight : 'bold',
            pointerEvents:'none'
          }).update({
            x:{field:'x0'}, x2:{field:'x1'},
            y:{field:'y0'}, y2:{field:'y1'},
            opacity : {callback:function(d) {
              var width  = this.getBBox().width;
              if(d.x1 - d.x0  <= width +2) return 0;
              else if(d.y1-d.y0 <= labelOffset) return 0;
              else return 1;
            }}
          });
        mark[rectName] = d3.daisy.mark()
          .type('rect')
          .name('background')
          .enter({
            x:{field:'x0'}, x2:{field:'x1'},
            y:{field:'y0'}, height:labelHeight,
            stroke:'#ddd', strokeWidth:0.5
          }).update({fill:'#eee',})
          .hover({ill : {value:exports.hoverColor()}});

        lastRegion.mark(mark[regionName]);
        lastRegion.mark(mark[rectName]);
        lastRegion.mark(mark[labelName]);
        lastRegion = mark[regionName];
       }
    });
  }
  function _packingMark(measures, dimensions, measure) {
    var transform = d3.daisy.transform()
      .transform({
        name:'facet',
        options:{
          flatten:false,
          groupby:dimensions.map(function(d){return d.field;})
        }})
      .transform({
        name:'pack',
        options: {
          size:[frame.innerWidth(),frame.innerHeight()],
          isRoot:false, //root가 없이 시작한다
          children:'values',
          field:measure.field,
          padding:2
        }});
    frame.transform(transform);
    var lastRegion = frame;
    dimensions.forEach(function(dimension, i) {
      var circleName = 'node_' + i + '_circle';
      if(i+1 === leafNodeDepth) circleName = 'node';
      mark[circleName] = d3.daisy.mark()
        .type('circle')
        .name('node');
      var update = {
       x:{field:'x'},
       y:{field:'y'},
       r:{field:'r'}};
      if(i+1 === leafNodeDepth) {
       update.fill = {field:'value', scale:scale.c};
       lastRegion.mark(mark[circleName]);
       mark.label = d3.daisy.mark()
         .type('text')
         .name('leaf label')
         .enter({
           text:{callback:function(d){return d.data.key;}},
           fontFamily:font.fontFamily,
           fontSize:font.fontSize,
           fontWeight:font.fontWeight,
           textAnchor:'middle',
           dy:'.35em',
           pointerEvents:'none',
         }).update({
           x:{field:'x'},
           y:{field:'y'},
           opacity : {callback:function(d) {
             var width  = this.getBBox().width;
             if(d.r*2  <= width) return 0;
             else return 1;
           }}
         });
      lastRegion.mark(mark.label);
      } else if(i+1 < leafNodeDepth) {
       var regionName = 'region_'+(i);
       mark[regionName] = d3.daisy.group()
        .name('node')
        .field('children'); // 평소에는 values이나 tree구조는 children 사용
       update.fill = {value:'#eee'};
       update.stroke = {value: '#ccc'};
       update.strokeWidth = '1px';

       lastRegion.mark(mark[circleName]);
       lastRegion.mark(mark[regionName]);
       lastRegion = mark[regionName];
      }

      mark[circleName].update(update).hover({ill : {value:exports.hoverColor()}});
    });
  }
  function _mark() {
    if(condition === 'histogram') {
      measure = exports.defaultMeasureForCount();
    } else {
      measure = measures[0];
    }
    if(shape === 'treemap') {
      _treemapMark(measures, dimensions, measure);
    } else if(shape === 'pack') {
      _packingMark(measures, dimensions, measure);
    }

  }
  function _tooltip() {
    if(!exports.tooltip()) return;
    var tooltip = d3.daisy.tooltip();
    tooltip.keyField({callback:function(d){return d.data.key;}})
      .valueField('value');
    if(shape === 'treemap') {
      tooltip.update({x:{field:'x0'}, y:{field:'y0'}});
    } else {
      tooltip.update({x:{field:'x'}, y:{field:'y'}});
    }
    var enterFunc = function(d){
      tooltip.show(d3.select(this));
    };
    var leaveFunc = function(){
      tooltip.hide(d3.select(this));
    };
    for(var m in mark) {
      if(mark.hasOwnProperty(m) && m.startsWith('node')) {
        mark[m].on('mouseenter', enterFunc);
        mark[m].on('mouseleave', leaveFunc);
      }
    }
  }

  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

d3.daisy.layout.markerMap = function() {
  var attrs ={
    addr:false,
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: '#75B8FA', // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: 'solid', // 선의 스타일 입니다
    fillColor: '#CFE7FF', // 채우기 색깔입니다
    fillOpacity: 0.7 // 채우기 불투명도 입니다
  };
  var mapBaseType = 'HYBRID';
  var defaultSize = {range:[1, 4], scale:'linear', reverse:false};
  var defaultMeasureLat = {field:'__lat__'}, defaultMeasureLng = {field:'__lng__'};
  var frame, condition, map, geocoder, data, dimensions, measures;
  var scale = {}, transforms= {}, mark ={}, axis={};
  var conditions = ['normal', 'point'];
  var bubbleStyleKeys = ["strokeWeight","strokeColor","strokeOpacity","strokeStyle","fillColor","fillOpacity"]; //버블 스타일 관련 키

  var exports = d3.daisy.layout.default();
  _init();
  function _init() {
    exports._frame = _frame;
    exports._condition = _condition;
    exports._render = _render;
  }

  function _condition() {
    dimensions = exports.dimensions();
    measures = exports.measures();
    if(dimensions.length > 2 ) {
      exports.conditionException() ; // TODO : error를 내보낸다.
    }
    if(!attrs.addr) {
      if(measures.length == 3) {
        condition = 'normal'; //bubble 형태
      } else if(measures.length == 2) {
        condition = 'point';
      } else {
        exports.conditionException();
      }
    } else {
      if(measures.length == 2) {
        condition = 'normal'; //point 형태
      } else if(measures.length == 1) {
        condition = 'point';
      } else {
        exports.conditionException();
      }
    }

  }

  function _frame() {
    data = exports.data();
    var width = exports.width(), height = exports.height(),
    margin = exports.margin();
    frame = d3.select(exports.container())
      .style('width', width+'px')
      .style('height', height+'px');

    frame.call(setMap);
  }
  function setMap(_selection) { // 지도 초기 세팅
    var options = {
      center: new daum.maps.LatLng(33.450701, 126.570667),
      level: 3
    }; // 기본 옵션, 실제 줌 레벨은 bound를 확인해서 자동 조절
    map = new daum.maps.Map(_selection.node(), options);
    map.setMapTypeId(daum.maps.MapTypeId[mapBaseType]);
    var zoomControl = new daum.maps.ZoomControl();
    map.addControl(zoomControl, daum.maps.ControlPosition.RIGHT);
    geocoder = new daum.maps.services.Geocoder();

    return _selection;
  }
  function _addr2coord  (addr, callback) { // 주소 변환에 사용
    geocoder.addr2coord(addr, function(status, result) {
      if(status === daum.maps.services.Status.OK) {
        return callback(null, result.addr[0]);
      } else {
        return callback(status); // 결과 없을 때 처리
      }
    });
  }
  function _bubble(d, lat, lng, value, key) {
    var level = map.getLevel();
    var coordFormat = d3.format('.2f');
    var earthR = 111111; // 툴팁 위치 조정시 사용
    var size = exports.size();
    if(!size) size = defaultSize;
    var radius = (condition === 'normal') ? scale.r(Math.pow(d[value.field], 0.5)) : size.range[0]*Math.pow(2,level);
    var circleOption = {
       center : d.__latLng__,  // 원의 중심좌표
       radius: radius, // 미터 단위의 원의 반지름
    };
    bubbleStyleKeys.forEach(function(k) {
      circleOption[k] = attrs[k];
    }); //버블 스타일링
    var circle = new daum.maps.Circle(circleOption);
    circle.setMap(map);

    if(attrs.showCenter) { //중점 표시
      var center = new daum.maps.Circle({
         center : d.__latLng__,
         radius: scale.r.range()[0]/4,
         fillColor: attrs.strokeColor,
         fillOpacity : attrs.strokeOpacity,
         strokeWeight : 0
       });
       center.setMap(map);
    }
    // 툴팁 그리기
    var format = d3.format('g');
    var keyVal = key ? d[key.field] : attrs.addr? d[measures[0].field] : '위도: ' + format(d[measures[0].field]) + '</br> 경도: ' + format(d[measures[1].field]);
    var content = '<div class="tooltip" style="padding:4px;font-size:12px;font-family:sans-serif;">' +
      '<div class="key" style="font-weight:bold;">'+ keyVal + '</div>'  +
      (condition == 'normal' && (value)? '<div class="value">'+ (value.field ? value.field + ': ': '') + coordFormat(d[value.field]) + '</div>' : '') +
      '</div>';
    var tooltip = new daum.maps.InfoWindow({
        position: new daum.maps.LatLng(d[lat.field] + radius/earthR, d[lng.field]),
        content: content
    });
    // 버블 마우스 이벤트
    daum.maps.event.addListener(circle, 'mouseover', function() {
      tooltip.open(map);
    });
    daum.maps.event.addListener(circle, 'mouseout', function() {
      tooltip.close();
    });
  }

  function _render() { //set scale
    var measure0, measure1;
    var size = exports.size();
    if(!size) size = defaultSize;
    var __rScale = function(data) {
      data.forEach(function(d) {
        d.__latLng__ = new daum.maps.LatLng(d[measure0.field], d[measure1.field]);
      });
      var bounds = new daum.maps.LatLngBounds();
      data.forEach(function(d){
        bounds.extend(d.__latLng__);
      });

      map.setBounds(bounds);
      var level = map.getLevel();
      if(condition === 'normal') {
        var measure2;
        scale.r = d3.scaleLinear().clamp(true);
        if(attrs.addr) {
          measure2 = measures[1];
        } else {
          measure2 = measures[2];
        }
        var magVal = Math.pow(2,level);
        var domainExtent = d3.extent(data.map(function(p){return Math.pow(p[measure2.field], 0.5);})); //크기 값의 최대 최소를 구함
        scale.r.domain(domainExtent)
          .range([size.range[0] * magVal, size.range[1]*magVal]); // 반지름의 최대 최소 값에 매핑
      }
    };
    if(attrs.addr) {
      var i = 0;
      measure0 = defaultMeasureLat;
      measure1 = defaultMeasureLng;
      var __callback = function(status, result) {
        if(status) {
          throw 'CAN NOT FIND COORDS';
        } else {
          data[i][measure0.field] = result.lat;
          data[i][measure1.field] = result.lng;
        }
        i+=1;
        if(i < data.length) {
          _addr2coord(data[i][measures[0].field], __callback);
        } else {
          __rScale(data);
          _mark();
        }
      };
      _addr2coord(data[i][measures[0].field], __callback);

    } else {
      measure0 = measures[0];
      measure1 = measures[1];
      __rScale(data);
      _mark();
    }

  } //end of _scale

  function _mark() {
    var dimension = dimensions[0];
    var measure0, measure1, measure2;
    if(attrs.addr) {
      measure0 = defaultMeasureLat;
      measure1 = defaultMeasureLng;
      measure2 = measures[1];
    } else {
      measure0 = measures[0];
      measure1 = measures[1];
      measure2 = measures[2];
    }
    if(condition === 'normal') data.sort(function(a,b){return b[measure2.field] - a[measure2.field];});
    data.forEach(function(d) {
      _bubble(d, measure0, measure1, measure2, dimension);
    });
  }
  d3.daisy.utils.setAttrDefaultFuncs(exports,attrs);
  return exports;
};

//# sourceMappingURL=daisy.layout.js.map