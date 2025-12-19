const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(10000); // 10 seconds timeout

  let testThreadId;
  let testReplyId;

  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test_board')
      .send({ text: 'Test thread', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        testThreadId = res.body._id;
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/test_board')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        done();
      });
  });

  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/test_board')
      .send({ text: 'Test reply', delete_password: 'pass', thread_id: testThreadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Find the reply ID we just made
        const reply = res.body.replies.find(r => r.text === 'Test reply');
        testReplyId = reply._id;
        done();
      });
  });

  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/test_board')
      .query({ thread_id: testThreadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, testThreadId);
        done();
      });
  });

  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/test_board')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/test_board')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.text, 'success');
        done();
      });
  });

  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .put('/api/threads/test_board')
      .send({ thread_id: testThreadId })
      .end(function(err, res) {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put('/api/replies/test_board')
      .send({ thread_id: testThreadId, reply_id: testReplyId })
      .end(function(err, res) {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/test_board')
      .send({ thread_id: testThreadId, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/test_board')
      .send({ thread_id: testThreadId, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.text, 'success');
        done();
      });
  });
});