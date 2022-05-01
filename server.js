var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/
  const session = JSON.parse(fs.readFileSync("./session.json").toString())

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery);

  if (path === "/sign_in" && method === "POST"){
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'));
    const array = [];
    request.on('data', (chunk)=>{
      array.push(chunk); 
    });
      request.on('end',()=>{
        const string = Buffer.concat(array).toString();
        const obj = JSON.parse(string);   //获得一个对象的name password
        const user = userArray.find((user)=> user.name ===obj.name 
        && user.password ===obj.password)
        if (user === undefined){
          response.statusCode = 400  
          response.setHeader("Content-Type", "text/json;charset=utf-8")
          //response.end(`{"errorCode": 4001}`)  //用户名密码不匹配
        } else {
          response.statusCode = 200
          const random = Math.random()
          const session = JSON.parse(fs.readFileSync("./session.json").toString())
          session[random] = {user_id: user.id}
          fs.writeFileSync("./session.json", JSON.stringify(session))
          response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`) //HttpOnly 不许前端碰我的cookie
        }
        response.end()
      });
  }else if (path === "/home.html"){
    //写不出来
      const cookie = request.headers["cookie"] //mdn中文，搜http，搜cookie
      let sessionId
      try {
         sessionId = cookie
         .split(";")
         .filter(s => s.indexOf("session_id")>=0)[0]
         .split("=")[1] //获取到这个数组的后面那个数值
      } catch (error){ }
    if (sessionId && session[sessionId]){
      const userId = session[sessionId].user_id
      const userArray = JSON.parse(fs.readFileSync("./db/users.json"))
      const user = userArray.find(user => user.id === userId)
      const homeHtml = fs.readFileSync("./public/home.html").toString()
      let string = ""
      if (user){
         string = homeHtml.replace("{{loginStatus}}", "已登录")
         .replace("{{user.name}}", user.name)
      }
      response.write(string)
    } else {
      const homeHtml = fs.readFileSync("./public/home.html").toString()
      const string = homeHtml.replace("{{loginStatus}}", "未登录")
           .replace("{{user.name}}", "")
      response.write(string) 
    }
    response.end()
  } else if (path === "/register" && method === "POST"){
    response.setHeader("Content-Type","text/html;charset=utf-8");
    //如果是get请求，可以用query请求用户的数据，如果是post，如下
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'));
    const array = [];
    request.on('data', (chunk)=>{
      array.push(chunk); //每次上传一点数据，就Push到数组里面
    });//监听上传的data事件,上传的一小部分数据
    request.on('end',()=>{
      const string = Buffer.concat(array).toString();
      //console.log(string)
      const obj = JSON.parse(string);
      //console.log(obj.name);
      //console.log(obj.password);
      const lastUser = userArray[userArray.length - 1]
      const newUser = {
        //id为最后一个用户的id+1
        id: lastUser ?  lastUser.id + 1: 1,
        name: obj.name,
        password: obj.password
      };
      userArray.push(newUser);
      fs.writeFileSync('./db/users.json',JSON.stringify(userArray));
      response.end();
    })//当结束后，打出数组
  } else {

    response.statusCode = 200;
    //默认首页
    const filePath = path === '/' ? '/index.html' :path; //如果path是/，默认文件等于index.html,否则还是等于path(路径)

    const index = filePath.lastIndexOf('.');
    //suffix是后缀
    const suffix = filePath.substring(index) ;
    const fileTypes = {  //用哈希表
        ".html ":"text/html",
        ".css ":"text/css",
        ".js ":"text/javascript",
        ".png ":"image/png",
        ".jpg ":"image/jpeg"
    }
    response.setHeader('Content-Type', 
    `${fileTypes[suffix] || 'text/html'};charset=utf-8`
    ) 
    //||如果出现上述条件不存在的，需要一个兜底值，html
    //console.log(suffix)
    //console.log(filePath.lastIndexOf('.'))  //获取文件点所在的第几位

    let content
    try {   //我这里面的代码有可能会报错
       content =fs.readFileSync(`./public${filePath}`)

    } catch (error){  //如果有错误，就抓住错误
        content = '文件不存在'
        response.statusCode = 404
    }
    //response.write(fs.readFileSync(`./public${x}`))
    response.write(content)
    response.end()
  }
  

  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log(
  '监听 ' + 
  port + 
  ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + 
  port
)

