const Queue = require("bull");
const moment = require("moment");
const Job = require("./models/Job");
const { executeCpp } = require("./executeCpp");
const { executePy } = require("./executePy");
const Problem = require("./models/Problem");
const { executeNPA } = require("./executeNPA");
// For running code with sample user input


const jobQueue = new Queue("job-runner-queue", {
  redis: { host: "localhost", port: 6379,  }
});

jobQueue.process(async ({ data }) => {
  console.log("run data is: ", data);
  const jobId = data.id;
  const job = await Job.findById(jobId);
  console.log("job is: ", job);

  if (job === undefined) {
    throw Error(`Cannot find job with id ${jobId}`);
  }

  try {
    let output;
    let output1;
    job["startedAt"] = new Date();
    // we need to run the file and send the response
    console.log("PROCESSING: ", job.language);

    if (job.language === "cpp" || job.language === "c"){
      output = await executeCpp(job.filepath, job.userInput);
    }
    else if(job.language === "npa"){
      const outputs = await executeNPA(job.filepath, job.userInput, job.syntax);
      output = outputs[0]; //
      output1 = outputs[1];
    }else{
      output = await executePy(job.filepath, job.userInput);
    }
    
    job["completedAt"] = new Date();
    job["status"] = "success";
    job["output"] = output;

    if(output1){
      console.log("WENT HERE PARSER");
      job["parser"] = output1;
    }

    await job.save();
    return true;
  } catch (err) {
    job["completedAt"] = new Date();
    job["status"] = "error";
    job["output"] = err;
    await job.save();
    throw Error(err);
  }
});

jobQueue.on("failed", (error) => {
  console.error(error.data.id, error.failedReason);
});

const addJobToQueue = async (jobId) => {
  jobQueue.add({
    id: jobId,
  });
};

// For submitting code and check testcase

const submitQueue = new Queue("job-submit-queue", {
  redis: { host: "localhost", port: 6379 },
});

submitQueue.process(async ({ data }) => {
  console.log("DATA IS: ", data);
  const jobId = data.id;
  const problemId = data.problemId;
  const job = await Job.findById(jobId);
  const problem = await Problem.findById(problemId);

  if (job === undefined || problem === undefined) {
    throw Error(`Invalid job/problem id`);
  }

  const testcases = problem.testcase;

  try {
    let output;
    let output1;
    job["startedAt"] = new Date();
    job["userId"] = data.userId;
    job["problemId"] = problemId;

    let passed = true;

    const checkTestcase = await Promise.all(testcases.map(async (item) => {
      const start = moment(new Date());
      try {
        const end = moment(new Date());
        if (job.language === "cpp" || job.language === "c")
          output = executeCpp(job.filepath, item.input);
        else if(job.language === "npa"){
          const outputs = await executeNPA(job.filepath, job.userInput, job.syntax);
          output = outputs[0]; //
          output1 = outputs[1];
        }
        else{
          output = executePy(job.filepath, item.input);
        }

        let outputUser = output.trim();
        let outputTestcase = item.output.trim();

        // const executionTime = end.diff(start, "seconds", true);
        // if (executionTime > problem.timelimit) {
        //   job["verdict"] = "tle";
        //   passed &= false
        //   return false;
        // }
        
        passed &= outputUser === outputTestcase;
        console.log("PASSED IS: ", passed);
        return outputUser === outputTestcase;
      } catch (error) {
        console.log({ error });
        return false; // Ensure the promise is always resolved even if there's an error
      }
    }));

    console.log("PASSED AFTER IS: ", passed);
    
    // Check if all test cases passed
    const allTestCasesPassed = checkTestcase.every(result => result);

    passed && allTestCasesPassed && (job["verdict"] = "ac");
    !passed && job["verdict"] !== "tle" && (job["verdict"] = "wa");

    if (passed && allTestCasesPassed) {
      const distinct_user = new Set(problem.whoSolved);
      distinct_user.add(data.userId);
      problem.whoSolved = [...distinct_user];
      await problem.save();
    }

    job["completedAt"] = new Date();
    job["status"] = "success";
    job["output"] = output;

    if(output1){
      console.log("WENT HERE PARSER");
      job["parser"] = output1;
    }

    await job.save();

    return true;
  } catch (err) {
    job["completedAt"] = new Date();
    job["status"] = "error";
    job["output"] = err;
    await job.save();
    throw Error(err);
  }
});


submitQueue.on("failed", (error) => {
  console.error(error.data.id, error.failedReason);
});

const addSubmitToQueue = async (jobId, problemId, userId) => {
  submitQueue.add({
    id: jobId,
    problemId,
    userId,
  });
};

module.exports = {
  addJobToQueue,
  addSubmitToQueue,
}; 