var http = require('http');
var url = require('url'); // url이라는 모듈이 필요하다고 Node.js에게 요구
var qs = require('querystring');
var template = require('./lib/template.js');
var db = require('./lib/db.js');
var topic = require('./lib/topic.js');
var mysql = require('mysql');

var db = mysql.createConnection({
  // 데이터베이스 접속에 필요한 정보를 정의
  host:'localhost',
  user:'nodejs',
  password:'1111',
  database:'opentutorials'
});

db.connect(); // 데이터베이스에 접속

var app = http.createServer(function(request,response){
    var _url = request.url; // 사용자가 요청한 URL
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if(pathname === '/'){ // 루트라면 기존 코드를 실행
      if(queryData.id === undefined){ // 쿼리 스트링이 없을 때의 처리 (홈일 때)
        topic.home(request, response);
      }else{ // 쿼리 스트링이 있을 때의 처리 (홈이 아닐 때)
        topic.page(request, response);
      }
    }else if(pathname === '/create'){
      topic.create(request, response);
    }else if(pathname === '/create_process'){
      topic.create_process(request, response);
    }else if(pathname === '/update'){
      topic.update(request, response);
    }else if(pathname === '/update_process'){
      topic.update_process(request, response);
    }else if(pathname === '/delete_process'){
      topic.delete_process(request, response);
    }
    else{ // 루트가 아니라면 새로운 코드를 실행 (404 오류 페이지)
      response.writeHead(404);
      response.end('Not found');
    }


});
app.listen(3000);
