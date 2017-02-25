var dataset = [
        {"x": 0, "y": 50, "z": 50, "c":"blue"}, {"x": 0, "y": 55, "z": 44, "c":"orange"},
        {"x": 1, "y": 43, "z": 23, "c":"blue"}, {"x": 1, "y": 20, "z": 20, "c":"orange"},
        {"x": 2, "y": 81, "z": 81, "c":"blue"}, {"x": 2, "y": 53, "z": 29, "c":"orange"},
        {"x": 3, "y": 19, "z": 19, "c":"blue"}, {"x": 3, "y": 87, "z": 87, "c":"orange"},
        {"x": 4, "y": 52, "z": 52, "c":"blue"}, {"x": 4, "y": 48, "z": 43, "c":"orange"},
        {"x": 5, "y": 24, "z": 34, "c":"blue"}, {"x": 5, "y": 49, "z": 79, "c":"orange"},
        {"x": 6, "y": 87, "z": 87, "c":"blue"}, {"x": 6, "y": 66, "z": 66, "c":"orange"},
        {"x": 7, "y": 17, "z": 17, "c":"blue"}, {"x": 7, "y": 27, "z": 27, "c":"orange"},
        {"x": 8, "y": 68, "z": 98, "c":"blue"}, {"x": 8, "y": 16, "z": 56, "c":"orange"},
        {"x": 9, "y": 49, "z": 49, "c":"blue"}, {"x": 9, "y": 15, "z": 15, "c":"orange"},
        {"x": 0, "y": 30, "z": 10, "c":"blue"}, {"x": 0, "y": 20, "z": 20, "c":"orange"},
        {"x": 1, "y": 43, "z": 53, "c":"blue"}, {"x": 1, "y": 91, "z": 91, "c":"orange"},
        {"x": 2, "y": 81, "z": 81, "c":"blue"}, {"x": 2, "y": 53, "z": 53, "c":"orange"},
        {"x": 3, "y": 19, "z": 19, "c":"blue"}, {"x": 3, "y": 87, "z": 47, "c":"orange"},
        {"x": 4, "y": 52, "z": 12, "c":"blue"}, {"x": 4, "y": 48, "z": 48, "c":"orange"},
        {"x": 5, "y": 24, "z": 24, "c":"blue"}, {"x": 5, "y": 49, "z": 39, "c":"orange"},
        {"x": 6, "y": 87, "z": 17, "c":"blue"}, {"x": 6, "y": 66, "z": 66, "c":"orange"},
        {"x": 7, "y": 17, "z": 17, "c":"blue"}, {"x": 7, "y": 27, "z": 17, "c":"orange"},
        {"x": 8, "y": 68, "z": 68, "c":"blue"}, {"x": 8, "y": 16, "z": 26, "c":"orange"},
        {"x": 9, "y": 49, "z": 49, "c":"blue"}, {"x": 9, "y": 15, "z": 15, "c":"orange"},
        {"x": 9, "y": 49, "z": 49, "c":"blue"}, {"x": 9, "y": 15, "z": 15, "c":"orange"}
      ];

var grouped = d3.daisy.layout.bar()
  .container('#content')
  .data(dataset)
  .dimensions(['c', 'x'])
  .measures({field:'y', op:'mean'})
  .stacked(false)
  .axis('x').axis('y')
  .legend(true);
grouped.render();

var stacked = d3.daisy.layout.bar()
  .container('#content2')
  .data(dataset)
  .dimensions(['x', 'c'])
  .measures({field:'y', op:'mean'})
  .stacked(true)
  .axis('x').axis('y')
  .legend(true);
stacked.render();

var mono = d3.daisy.layout.bar()
  .container('#content3')
  .data(dataset)
  .dimensions(['x'])
  .measures({field:'y', op:'sum'})
  .axis('x').axis('y')
  .legend(true);
mono.render();

var hist = d3.daisy.layout.bar() //measure가 없는 경우
  .container('#content4')
  .data(dataset)
  .dimensions(['x', 'c'])
  .stacked(true)
  .axis('x').axis('y')
  .legend(true);
hist.render();

var mixed = d3.daisy.layout.bar() //measure가 2개 이상인 경우 경우
  .container('#content5')
  .data(dataset)
  .dimensions(['c'])
  .measures([{field:'x', op:'sum'}, {field:'y', op:'mean'}, {field:'z', op:'mean'}])
  .axis('x').axis('y')
  .legend(true);
mixed.render();

var mixStacked = d3.daisy.layout.bar() //measure가 2개 이상인 경우 경우
  .container('#content6')
  .data(dataset)
  .dimensions(['c'])
  .measures([{field:'x', op:'sum'}, {field:'y', op:'mean'}, {field:'z', op:'mean'}])
  .axis('x').axis('y')
  .stacked(true)
  .legend(true);
mixStacked.render();


var groupedHorizontal = d3.daisy.layout.bar()
  .container('#content7')
  .data(dataset)
  .dimensions(['c', 'x'])
  .measures({field:'y', op:'mean'})
  .stacked(false)
  .margin({left : 80})
  .axis('x').axis('y')
  .orient('horizontal')
  .legend(true);
groupedHorizontal.render();


var stackedHorizontal = d3.daisy.layout.bar()
  .container('#content8')
  .data(dataset)
  .dimensions(['x', 'c'])
  .measures({field:'y', op:'mean'})
  .stacked(true)
  .margin({left : 80})
  .axis('x').axis('y')
  .orient('horizontal')
  .legend(true);
stackedHorizontal.render();

var monoHorizontal = d3.daisy.layout.bar()
  .container('#content9')
  .data(dataset)
  .dimensions(['x'])
  .measures({field:'y', op:'sum'})
  .axis('x').axis('y')
  .orient('horizontal')
  .legend(true);
monoHorizontal.render();


var color = d3.daisy.layout.bar()
  .container('#content10')
  .data(dataset)
  .dimensions(['c', 'x'])
  .measures({field:'y', op:'mean'})
  .stacked(false)
  .margin({left : 80})
  .axis('x').axis('y')
  .orient('horizontal')
  .color(['#ffffe0','#ffe3af','#ffc58a','#ffa474','#fa8266','#ed645c','#db4551','#c52940','#aa0e27','#8b0000'])
  .legend(true);
color.render();
