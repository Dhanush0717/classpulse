const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const Feedback = require("../src/models/Feedback");
const Session = require("../src/models/Session");
const Student = require("../src/models/Student");
const { submitFeedback } = require("../src/controllers/feedbackController");

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test("feedback schema stores no student identity", () => {
  assert.equal(Feedback.schema.path("studentId"), undefined);
  assert.equal(Feedback.schema.path("respondentKey").options.select, false);
});

test("feedback validation rejects ratings outside 1-5", async () => {
  const res = createResponse();
  await submitFeedback(
    {
      body: { pace: 6, understanding: 3 },
      student: { id: "student", sessionId: "session" }
    },
    res
  );

  assert.equal(res.statusCode, 400);
});

test("saved feedback uses an anonymous key and returns no identity", async () => {
  const originals = {
    findSession: Session.findOne,
    findStudent: Student.findOne,
    saveFeedback: Feedback.findOneAndUpdate
  };
  let savedFilter;
  let savedUpdate;

  try {
    Session.findOne = () => Promise.resolve({ _id: "session" });
    Student.findOne = () => Promise.resolve({ _id: "student" });
    Feedback.findOneAndUpdate = (filter, update) => {
      savedFilter = filter;
      savedUpdate = update;
      return {
        select: () =>
          Promise.resolve({
            sessionId: "session",
            pace: 4,
            understanding: 5,
            comment: "Clear explanation"
          })
      };
    };

    const res = createResponse();
    await submitFeedback(
      {
        body: {
          pace: 4,
          understanding: 5,
          comment: "Clear explanation"
        },
        student: { id: "student", sessionId: "session" }
      },
      res
    );

    assert.equal(res.statusCode, 201);
    assert.match(savedFilter.respondentKey, /^[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(savedUpdate).includes("studentId"), false);
    assert.equal(JSON.stringify(res.body).includes("respondentKey"), false);
    assert.equal(JSON.stringify(res.body).includes("studentId"), false);
  } finally {
    Session.findOne = originals.findSession;
    Student.findOne = originals.findStudent;
    Feedback.findOneAndUpdate = originals.saveFeedback;
  }
});
