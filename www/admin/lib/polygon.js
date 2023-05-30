(function(w){
  /*
   方法名称：isPolygon
   功能描述：判断是否是多边形
   判断依据:多边形的每条线段最多和两条线段相交
   参数描述：
   pointData：多边形各个点的顺序数组([{lat:31,lng:121},{lat:32,lng:122}])
   返回值:
   true：是多边形
   false：不是多边形
   TODO：需要增加错误提示，和点数限制
   */
  var isPolygon = function(pointData){
    //console.log("pointData:",pointData)
    var pointsList = unique(pointData);
    //console.log("pointsList:",pointsList)
    if(pointsList.length < 3){
      return true;
    }
    var len = pointsList.length,
        isPolygon = true,
        line = null,
        otherLineList = [],
        currentLine = null,
        item = null,
        OverlapLineCount = 0,
        prevItem = null,
        nextItem = null;
    if(len < 3){
      return false;
    }
    for(var i = 0;i < len; i++){
      item =  pointsList[i];
      prevItem = pointsList[i-1];
      if( i == len-1){
        nextItem = pointsList[0];
      }else{
        nextItem = pointsList[i+1];
      }
      currentLine = {
        S:{
          x:item.lat,
          y:item.lng,
        },
        E:{
          x:nextItem.lat,
          y:nextItem.lng,
        }
      }
      otherLineList = getPolygonLine(pointsList,currentLine);
      OverlapLineCount = getOverlapCount(currentLine,otherLineList);
      if(OverlapLineCount.length > 2){
        isPolygon = false;
        break;
      }
    }
    return isPolygon;
  }
  var unique = function(list){
    var res = [],
        json = {},
        key = "",
        item = null,
        len = list.length;
    for(var i = 0; i < len; i++){
      item = list[i];
      key = "" + item.lat + item.lng;
     if(!!json[key] == false){
      res.push(item);
      json[key] = 1;
     }
    }
    return res;
  }
  /*
   方法名称：getPolygonLine
   功能描述：获取多边形除指定线段的其他线段
   参数描述：
   pointsList：多边形各个点的顺序数组
   line：指定排除的线段
   返回值:多边形线段数组
   */
  var getPolygonLine = function(pointsList,expectLine){
    var len = pointsList.length,
        line = null,
        item = null,
        lineList = [],
        prevItem = null,
        nextItem = null;
    for(var i = 0;i < len; i++){
      item =  pointsList[i];
      prevItem = pointsList[i-1];
      if( i == len-1){
        nextItem = pointsList[0];
      }else{
        nextItem = pointsList[i+1];
      }
      if(parseFloat(item.lat) == parseFloat(expectLine.S.x) && parseFloat(item.lng) == parseFloat(expectLine.S.y)){
        continue;
      }
      line = {
        S:{
          x:item.lat,
          y:item.lng,
        },
        E:{
          x:nextItem.lat,
          y:nextItem.lng,
        }
      }
      lineList.push(line);
    }
    return lineList;
  }
  /*
   方法名称：getOverlapCount
   功能描述：获取指定线段与线段数组里面相交的线段(不包括斜率一致的)
   参数描述：
   line：指定线段
   lineList：线段数组
   返回值:返回相交的线段
   */
  var getOverlapCount = function(line,lineList){
    var len = lineList.length,
        item = null,
        OverlapLine = [];
    for(var i = 0; i < len; i++){
      item = lineList[i];
      if(isOverlapping(line,item) && isEqualK(line,item) == false){
        OverlapLine.push(item);
      }
    }
    return OverlapLine;
  }
  /*
   方法名称：isEqualK
   功能描述：判断斜率是否一致
   参数描述：
   lineA：线段A
   lineB：线段B
   返回值:
    true:一致
    false:不一致
   */
  var isEqualK = function(lineA,lineB){
    var lineAK = getLineK(lineA.S.x,lineA.S.y,lineA.E.x,lineA.E.y);
    var lineBK = getLineK(lineB.S.x,lineB.S.y,lineB.E.x,lineB.E.y);
    return lineAK == lineBK;
  }
  /*
   方法名称：isOverlapping
   功能描述：判断两个线段是否相交
   参数描述：
   lineA：线段A
   lineB：线段B
   返回值:
   true：交叉
   false：不交叉
   判断依据:1：判断两条线段的端点是否存在在彼此之上的情况,2：判断两个线段的两个端点是否都在彼此的两边
   */
  var isOverlapping = function(lineA,lineB){
    var lineAStartPointInLineB = isPointInLine(lineA.S,lineB.S,lineB.E);
    var lineAEndPointInLineB = isPointInLine(lineA.E,lineB.S,lineB.E);
    var lineBStartPointInLineA = isPointInLine(lineB.S,lineA.S,lineA.E);
    var lineBEndPointInLineA = isPointInLine(lineB.E,lineA.S,lineA.E);
    //只要有一点在另外一条线上我们就认为相交,也就是两条直线相交
    if(lineAStartPointInLineB == 0 || lineAEndPointInLineB == 0 || lineBStartPointInLineA == 0 || lineBEndPointInLineA == 0 ){
      return true;
    }
    //如果上面条件不满足,点都不在对应的线段上,但是有一个点在另外一条线的延长线上,说明一定不会相交
    if(lineAStartPointInLineB == -2 || lineAEndPointInLineB == -2 || lineBStartPointInLineA == -2 || lineBEndPointInLineA == -2 ){
      return false;
    }
    //因为在上面是1,在下面是-1,两个相乘如果小于0则一定在两边,如果两条线段的两个端点分别在对应线段的两端,说明相交
    if(lineAStartPointInLineB*lineAEndPointInLineB < 1 && lineBStartPointInLineA*lineBEndPointInLineA < 1){
      return true;
    }
    return false;//默认不相交
  }
  /*
   方法名称：isPointInLine
   功能描述：判断点point是否在以linePS为起点,linePE为终点的线段上
   参数描述：
   point：点
   linePS：线段起点
   linePE：线段终点
   返回值:
   0：在线段上
   1：不在线段上，而是在线段的上方
   -1：不在线段上，而是在线段的下方
   -2:不在线段上，而是在线段所在的直线上
   */
  var isPointInLine = function(point,linePS,linePE){
    var maxLineX = 0,
        minLineX = 0,
        maxLineY = 0,
        minLineY = 0,
        K = getLineK(linePS.x,linePS.y,linePE.x,linePE.y);
    var B = getLineB(linePS.x,linePS.y,K);
    var linePointY = (K*point.x+B);
    if(linePS.x < linePE.x){
      maxLineX = linePE.x;minLineX = linePS.x;
    }else{
      maxLineX = linePS.x;minLineX = linePE.x;
    }
    if(linePS.y < linePE.y){
      maxLineY = linePE.y;minLineY = linePS.y;
    }else{
      maxLineY = linePS.y;minLineY = linePE.y;
    }
    if(point.x >= minLineX && point.x <= maxLineX && point.y >= minLineY && point.y <= maxLineY){//在线段所在的矩形范围之内
      if(linePointY == point.y){
        return 0;
      }else if(linePointY > point.y){
        if(point.y >= 0){
          return -1
        }else {
          return 1
        }
      }else{
        if(point.y >= 0){
          return 1
        }else {
          return -1
        }
      }
    }else{
      if(linePointY == point.y){
        return -2;
      }else if(linePointY > point.y){
        if(point.y >= 0){
          return -1
        }else{
          return 1
        }
      }else{
        if(point.y >= 0){
          return 1
        }else{
          return -1
        }
      }
    }
  }
  /*
   方法名称：getLineK
   功能描述：获取线段的斜率
   参数描述：
   x1：X坐标1
   y1：Y坐标1
   x2：X坐标2
   y2：Y坐标2
   返回值:斜率
   */
  var getLineK = function(x1,y1,x2,y2){
    return (y1-y2)/(x1-x2);
  }
  /*
   方法名称：getLineB
   功能描述：获取线段的y轴截距
   参数描述：
   x1：X坐标1
   y1：Y坐标1
   k：斜率
   返回值:线段的y轴截距
   */
  var getLineB = function(x1,y1,k){
    return y1-k*x1;
  };
  w.isPolygon = isPolygon;
})(window);