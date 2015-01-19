/**
 * Created by tudalex on 17/01/15.
 */
function Job(arrivalTime, executionTime, id, deps) {
    this.id = id;
    this.arrivalTime = arrivalTime;
    this.startTime = -1;
    this.executionTime = executionTime;
    this.elapsedTime = 0;
    this.finished = false;
    this.running = false;
    this.deps = deps;
}

function Node() {
    this.job = undefined;

}

function TSS(nodes, mode) {
    this.time = 0;
    this.jobs = [];
    this.nodes = [];
    var i;
    for (i = 0; i < nodes; ++i) {
        nodes.push(new Node());
    }
}

TSS.prototype.runNode = function(node, time) {
    job = node.job;
    job.elapsedTime += (job.elapsedTime + time) > job.executionTime ? job.executionTime - job.elapsedTime : time;
    if (job.elapsedTime >= job.executionTime) {
        node.job = undefined;
        job.finished = true;
    }
};

TSS.prototype.launchJobOnNode = function(node, job) {
    node.job = job;
    job.running = true;
    job.startTime = this.time;
};

TSS.prototype.run = function() {

};


