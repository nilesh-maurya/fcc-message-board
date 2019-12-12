/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;

const mongoose = require("mongoose");

mongoose.connect(process.env.DB, { useNewUrlParser: true, useFindAndModify: false });

const threadSchema = mongoose.Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: { type: Boolean, default: false },
  delete_password: String,
  replies: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
    default: []
  }
});

const Thread = mongoose.model("Thread", threadSchema);

const replySchema = mongoose.Schema({
  thread_id: { type: mongoose.Schema.Types.ObjectId, ref: "Thread" },
  text: String,
  created_on: Date,
  delete_password: String,
  reported: { type: Boolean, default: false }
});

const Reply = mongoose.model("Reply", replySchema);

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .post(async function(req, res) {
      console.log("post /api/threads/:board");
      const board = req.params.board;
      const text = req.body.text;
      const deletePassword = req.body.delete_password;

      if (!board || !text || !deletePassword) {
        return res.send("must entered text and delete password");
      }

      const newThread = new Thread({
        board: board,
        text: text,
        created_on: new Date(),
        bumped_on: new Date(),
        delete_password: deletePassword
      });

      try {
        const thread = await newThread.save();
        res.redirect(`/b/${thread.board}`);
      } catch (err) {
        console.log(err);
      }
    })
    .get(async function(req, res) {
      const board = req.params.board;
      if (!board) {
        return res.send("must enter board");
      }
      try {
        const threads = await Thread.find({ board: board }, "-delete_password -reported", {
          sort: { bumped_on: -1 },
          limit: 10
        }).populate({
          path: "replies",
          select: "-delete_password -reported"
        });

        threads.map(thread => {
          if (thread.replies.length > 3) {
          thread.replies = thread.replies.sort().reverse();
          thread.replies = thread.slice(0, 3);
        }
        });
      

        res.json(threads);
      } catch (err) {
        console.log(err);
      }
    })
    .put(async function(req, res) {
      const board = req.params.board;
      const thread_id = req.body.thread_id;
      if (!board || !thread_id) {
        return res.send("must enter board and thread_id");
      }

      try {
        const updatedThread = await Thread.findByIdAndUpdate(
          { _id: thread_id },
          { $set: { reported: true } },
          { new: true }
        );
        res.send("success");
      } catch (err) {
        console.log(err);
      }
    })
    .delete(async function(req, res) {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;
      console.log(board, thread_id, delete_password);
      if (!board || !thread_id || !delete_password) {
        return res.send("incorrect id and/or password");
      }
      try {
        const thread = await Thread.findOne({ _id: thread_id, board });
        if (!thread) {
          return res.send("no recored exists");
        }
        if (delete_password === thread.delete_password) {
          await Thread.remove({ _id: thread._id });
          const replies = await Reply.deleteOne({ thread_id: thread._id });
          res.send("success");
        } else {
          return res.send("incorrect password");
        }
      } catch (err) {
        console.log(err);
      }
    });

  app
    .route("/api/replies/:board")
    .post(async function(req, res) {
      const board = req.params.board;
      const { text, delete_password, thread_id } = req.body;
      if (!text || !thread_id || !delete_password || !board) {
        return res.send(
          "must enter text, thread_id, delete password and/or board"
        );
      }

      try {
        let thread = await Thread.findOne({ _id: thread_id, board });
        if (!thread) {
          return res.send("no record exists with id: " + thread_id);
        }

        const reply = await new Reply({
          thread_id: thread_id,
          text: text,
          created_on: new Date(),
          delete_password: delete_password
        }).save();

        thread.replies.push(reply._id);
        thread.bumped_on = new Date();
        thread = await thread.save();
        res.redirect(`/b/${board}/${thread._id}`);
      } catch (err) {
        console.log(err);
      }
    })
    .get(async function(req, res) {
      const board = req.params.board;
      const thread_id = req.query.thread_id;
      if (!board || !thread_id) {
        return res.send("must enter board and thread is");
      }
      try {
        const thread = await Thread.findOne({ _id: thread_id, board }).populate(
          { path: "replies", select: "-delete_password -reported" }
        );
        if (!thread) {
          return res.send("enter valid board and thread id");
        }
        res.json(thread);
      } catch (err) {
        console.log(err);
      }
    })
    .put(async function(req, res) {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;
      if (!board || !thread_id || !reply_id) {
        return res.send("must enter board, thread_id and reply_id");
      }
      try {
        const updatedReply = await Reply.findOneAndUpdate(
          { thread_id, _id: reply_id },
          { reported: true },
          { new: true }
        );
        if (!updatedReply) {
          return res.send(
            "no record exists with reply id " +
              reply_id +
              " and with thread id " +
              thread_id
          );
        }
        res.send("success");
      } catch (err) {
        console.log(err);
      }
    })
    .delete(async function(req, res) {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;
      if (!board || !thread_id || !reply_id || !delete_password) {
        return res.send(
          "must enter board, thread_id, reply id, password to delete"
        );
      }
      try {
        const reply = await Reply.findOne({ _id: reply_id, thread_id });
        if (!reply) {
          return res.send(
            "no record exists with reply id " +
              reply_id +
              " and with thread id " +
              thread_id
          );
        }
        if (delete_password === reply.delete_password) {
          reply.text = "[deleted]";
          await reply.save();
          res.send("success");
        } else {
          return res.send("incorrect password");
        }
      } catch (err) {
        console.log(err);
      }
    });
};
