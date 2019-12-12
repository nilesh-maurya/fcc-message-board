/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

let threadId;
let replyId;
let deletePassword = 'test123';

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      
      test('POST /api/threads/:board => Post new thread', function(done){
        chai.request(server)
          .post('/api/threads/testBoard')
          .send({ text: 'test #1', delete_password: deletePassword })
          .end( function(err, res){
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      
      test(' Get /api/threads/:board => Get most recent threads', function(done){
        chai.request(server)
          .get('/api/threads/testBoard')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isAtMost(res.body.length, 10, 'res.body.length should be at most 10 threads');
            res.body.forEach(thread => {
              assert.notProperty(thread, 'reported', 'results should not contain reported property');
              assert.notProperty(thread, 'delete_password', 'results should not contain delete_password property');
            });
            
            threadId = res.body[0]['_id'];
            done();
        })
      });
    });
    
    suite('DELETE', function() {
      
      test('DELETE /api/threads/testBoard => delete thread => "Incorrect Password"', function(done){
        chai.request(server)
          .delete('/api/threads/testBoard')
          .send({
            thread_id: threadId,
            delete_password: 'test'
        }).end(function(err, res){
          console.log(res.text);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
        });
      });
      
      test('DELETE /api/threads/:board => delete the thread => "success" ', function(done){
        chai.request(server)
          .delete('/api/threads/testBoard')
          .send({
            thread_id: threadId,
            delete_password: deletePassword
        }).end(function(err, res){
          console.log(res.text);
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
          
          done();
        });
      });
      
    });
    
    suite('PUT', function() {
      test('POST /api/threads/:board => Post new thread for testing update', function(done){
        chai.request(server)
          .post('/api/threads/testBoard')
          .send({ text: 'test #4', delete_password: deletePassword })
          .end( function(err, res){
            assert.equal(res.status, 200);
            done();
          });
      });
      
      test(' Get /api/threads/:board => Get most recent threads', function(done){
        chai.request(server)
          .get('/api/threads/testBoard')
          .end(function(err, res){
            assert.equal(res.status, 200);
            threadId = res.body[0]['_id'];
            done();
        })
      });
      
      test('PUT /api/threads/:board => update thread => "success" ', function(done){
        chai.request(server)
          .put('/api/threads/testBoard')
          .send({ thread_id: threadId })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
    });
  });
  
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('POST /api/replies/:board => post reply to thread', function(done){
        chai.request(server)
          .post('/api/replies/testBoard')
          .send({
            thread_id: threadId,
            text: 'Some Rondom Reply',
            delete_password: deletePassword
        }).end(function(err, res){
            assert.equal(res.status, 200);
            done();
        })
      });
    });
    
    suite('GET', function() {
      test('GET /api/replies/:board => get entire thread with its all replies', function(done){
        chai.request(server)
          .get('/api/replies/testBoard')
          .query({ thread_id: threadId})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isObject(res.body, 'thread should be an Object');
            assert.equal(res.body['_id'], threadId, 'threadId should be same');

            assert.property(res.body, 'replies', 'Thread should have replies property.');
            assert.isArray(res.body['replies'], 'replies property on thread should be an Array.');
          
            res.body['replies'].forEach(reply => {
              assert.isObject(reply, 'Each reply should be an object.');
              assert.property(reply, '_id', 'reply should have an unique _id property');
              assert.property(reply, 'text', 'reply should have text property');
              assert.property(reply, 'created_on', 'reply should have created_on property.');
            });
            assert.equal(res.body['replies'][0]['text'], 'Some Rondom Reply');
            replyId = res.body['replies'][0]['_id'];
            
            done();
        })
      });
    });
    
    suite('PUT', function() {
      test('PUT /api/replies/:board => update reply => "success" ', function(done){
        chai.request(server)
          .put('/api/replies/testBoard')
          .send({
            thread_id: threadId,
            reply_id: replyId
        }).end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('DELETE /api/replies/:board => delete reply => "incorrect password" ', function(done){
        chai.request(server)
          .delete('/api/replies/testBoard')
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: 'test'
        }).end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
        });
      });
      
      test('DELETE /api/replies/:board => delete reply => "success" ', function(done){
        chai.request(server)
          .delete('/api/replies/testBoard')
          .send({
            thread_id: threadId,
            reply_id: replyId,
            delete_password: deletePassword
        }).end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
    });
    
  });

});
