var http = require('http');
var url = require('url'); // url이라는 모듈이 필요하다고 Node.js에게 요구
var qs = require('querystring');
var template = require('./lib/template.js');
var db = require('./lib/db.js');

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
        db.query(`SELECT * FROM topic`, function(err, topics){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = template.list(topics);
          var html = template.HTML(title, list, 
            `<h2>${title}</h2>${description}`,
            `<a href = "/create">create</a>`
            );
            response.writeHead(200);
            response.end(html);
        });
      }else{ // 쿼리 스트링이 있을 때의 처리 (홈이 아닐 때)
        db.query(`SELECT * FROM topic`, function(error, topics){
          if(error){
            throw error;
          }
          db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id=author.id 
            WHERE topic.id=?`, [queryData.id], function(error2, topic){
            if(error2){
              throw error2;
            }
            console.log(topic);
            var title = topic[0].title;
            var description = topic[0].description;
            var list = template.list(topics);
            var html = template.HTML(title, list,
              `<h2>${title}</h2><p>${description}<p>by ${topic[0].name}</p>`, 
              `<a href="/create">create</a>
              <a href="/update?id=${queryData.id}">update</a>
              <form action="/delete_process" method="post" onsubmit="return confirm('정말로 삭제하시겠습니까?')">
                <input type="hidden" name="id" value="${queryData.id}">
                <input type="submit" value="delete">
              </form>`
            );
            response.writeHead(200);
            response.end(html);
          });
        });
        /*
        fs.readdir('./data', function(err, filelist){
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
              allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.HTML(sanitizedTitle, list,
              `<h2>${sanitizedTitle}</h2><p>${sanitizedDescription}</p>`,
              `<a href="/create">create</a>
              <a href="/update?id=${sanitizedTitle}">update</a>
              <form action="/delete_process" method="post" onsubmit="return confirm('정말로 삭제하시겠습니까?')">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>`
            );
            response.writeHead(200);
            response.end(html);
          })
        });
        */
        }
    }else if(pathname === '/create'){
      db.query(`SELECT * FROM topic`, function(error, topics){
        db.query('SELECT * FROM author', function(error2, authors){
          var title = 'Create';
          var list = template.list(topics);
          var html = template.HTML(title, list, `
            <form action="/create_process" method="post">
              <p><input type="text" name="title" placeholder="title"></p>
              <p>
                <textarea name="description" placeholder="description""></textarea>
              </p>
              <p>
                ${template.authorSelect(authors)}
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `, `<a href = "/create">create</a>`);
          response.writeHead(200);
          response.end(html);
        });
      });
    }else if(pathname === '/create_process'){
      var body = '';
      request.on('data', function(data){ // 데이터를 수신할 때마다 발생
        // 조각조각 나눠서 데이터를 수신할 때마다 호출되는 콜백 함수
        // 데이터를 처리하는 기능을 정의
        body = body + data;
      })
      request.on('end', function(){ // 데이터 수신을 완료하면 발생
        // 더이상 수신할 정보가 없으면 호츌되는 콜백 함수
        // 데이터 처리를 마무리하는 기능을 정의
        var post = qs.parse(body); // body에 누적된 내용을 post에 담음
        db.query(`
          INSERT INTO topic (title, description, created, author_id)
              VALUES(?, ?, Now(), ?)`,
          [post.title, post.description, post.author], 
          function(error, result){
            if(error){
              throw error;
            }
            response.writeHead(302, {Location: `/?id=${result.insertId}`});
            response.end();
          }
        );
      });
    }else if(pathname === '/update'){
      db.query(`SELECT * FROM topic`, function(error, topics){
        if(error){
          throw error;
        }
        db.query(`SELECT * FROM topic WHERE id=?`, [queryData.id], function(error2, topic){
          if(error2){
            throw error2;
          }
          db.query('SELECT * FROM author', function(error2, authors){
            var list = template.list(topics);
            var html = template.HTML(topic[0].title, list,
              `<form action="/update_process" method="post">
                <input type="hidden" name="id" value="${topic[0].id}">
                <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
                <p>
                  <textarea name="description" placeholder="description"">${topic[0].description}</textarea>
                </p>
                <p>
                  ${template.authorSelect(authors)}
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>`,
              `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`
            );
          response.writeHead(200);
          response.end(html);
          });
        });
      });
    }else if(pathname === '/update_process'){
      var body = '';
        request.on('data', function(data) {
            body = body + data;
        });
        request.on('end', function() {
            var post = qs.parse(body);
            db.query(`UPDATE topic SET title=?, description=?, author_id=? WHERE id=?`, 
              [post.title, post.description, post.author, post.id], function(error, result){
                response.writeHead(302, {Location: `/?id=${post.id}`});
                response.end();
            });
        });
    }else if(pathname === '/delete_process'){
      var body = '';
      request.on('data', function(data){
        body = body + data;
      });
      request.on('end', function(){
        var post = qs.parse(body);
        db.query(`DELETE FROM topic WHERE id=?`, [post.id], function(error, result){
          if(error){
            throw error;
          }
          response.writeHead(302, {Location: `/`}); //
          response.end();
        });
      });
    }
    else{ // 루트가 아니라면 새로운 코드를 실행 (404 오류 페이지)
      response.writeHead(404);
      response.end('Not found');
    }


});
app.listen(3000);
