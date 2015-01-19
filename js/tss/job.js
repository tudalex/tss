/**
 * Created by tudalex on 17/01/15.
 */
"use strict";
// Priority queue implementation from http://jsfiddle.net/GRIFFnDOOR/r7tvg/
function Event (data, priority) {
    this.data = data;
    this.priority = priority;
}
Event.prototype.toString = function(){return this.priority};

// takes an array of objects with {data, priority}
function PriorityQueue (arr) {
    this.heap = [null];
    if (arr) for (i=0; i< arr.length; i++)
        this.push(arr[i].data, arr[i].priority);
}

PriorityQueue.prototype = {
    push: function (data, priority) {
        var node = new Event(data, priority);
        this.bubble(this.heap.push(node) - 1);
    },

    // removes and returns the data of highest priority
    pop: function () {
        var topVal = this.heap[1].data;
        this.heap[1] = this.heap.pop();
        this.sink(1);
        return topVal;
    },
    peek: function() {
        var topVal = this.heap[1].data;
        return topVal;
    },

    // bubbles node i up the binary tree based on
    // priority until heap conditions are restored
    bubble: function (i) {
        while (i > 1) {
            var parentIndex = i >> 1; // <=> floor(i/2)

            // if equal, no bubble (maintains insertion order)
            if (!this.isHigherPriority(i, parentIndex)) break;

            this.swap(i, parentIndex);
            i = parentIndex;
        }
    },

    // does the opposite of the bubble() function
    sink: function (i) {
        while (i * 2 < this.heap.length) {
            // if equal, left bubbles (maintains insertion order)
            var leftHigher = !this.isHigherPriority(i * 2 + 1, i * 2);
            var childIndex = leftHigher ? i * 2 : i * 2 + 1;

            // if equal, sink happens (maintains insertion order)
            if (this.isHigherPriority(i, childIndex)) break;

            this.swap(i, childIndex);
            i = childIndex;
        }
    },

    // swaps the addresses of 2 nodes
    swap: function (i, j) {
        var temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    },

    // returns true if node i is higher priority than j
    isHigherPriority: function (i, j) {
        return this.heap[i].priority < this.heap[j].priority;
    }
};

function Edge(src, dest, cost) {
    this.src = src;
    this.dest = dest;
    this.cost = cost;
}

function Job(executionTime, id) {
    this.id = id;
    this.startTime = -1;
    this.executionTime = executionTime;
    this.elapsedTime = 0;
    this.finished = false;
    this.running = false;
    this.succ = [];
    this.pred = [];
}

Job.prototype.remainingTime = function() {
    return this.executionTime - this.elapsedTime;
};

Job.prototype.addDep = function (job, cost) {
    if (job === null)
        return;
    var edge = new Edge(this, job, cost);
    job.succ.push(edge);
    this.pred.push(edge);
};

function Node(id) {
    this.job = undefined;
    this.id = id;
    this.jobs_list = [];
    this.queueTime = 0;
}

Node.prototype.enqueueJob = function (job) {
    this.jobs_list.push(job);
    this.queueTime += job.executionTime;
};

function TSS(nodes, mode) {
    this.time = 0;
    this.jobs = [];
    this.nodes = [];
    this.scheduler = undefined;
    this.mode = mode ? mode : 'static';
    var i;
    for (i = 0; i < nodes; ++i) {
        this.nodes.push(new Node(i));
    }
}

TSS.prototype.runNode = function(node, time) {
    var job = node.job;
    job.elapsedTime += (job.elapsedTime + time) > job.executionTime ? job.executionTime - job.elapsedTime : time;
    if (job.elapsedTime >= job.executionTime) {
        node.job = undefined;
        job.finished = true;
    }
};

TSS.prototype.launchJobOnNode = function(node, job) {
    if (node.job != undefined)
        return false;
    node.job = job;
    job.running = true;
    job.startTime = this.time;
    job.executedOn = node.id;
    return true;
};

TSS.prototype.setCode = function(code) {
    // WARNING! If you update this, update the function below also
    this.scheduler = new Function("jobs", "nodes", "launchJobOnNode", "time", "pq", code);
};

TSS.prototype.runScheduler = function(jobs) {
    this.scheduler(jobs, this.nodes, this.launchJobOnNode.bind(this), this.time, new PriorityQueue());
};

TSS.prototype.generateRandomJobs = function(count) {
    var i;
    var job;
    var l;
    var j;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomElement(a) {
        if (a.length === 0)
            return null;
        return a[getRandomInt(0, a.length-1)];
    }

    for (i = 0; i < count; ++i) {
        job = new Job(getRandomInt(1, 10), i);
        l = getRandomInt(1, Math.min(10, this.jobs.length));
        for (j = 0; j < l; ++j) {
            job.addDep(getRandomElement(this.jobs));
        }
        this.jobs.push(job);
    }
};

TSS.prototype.finishedAllJobs = function() {
    //TODO: Optimize this with a counter
    var i = 0;
    for (i = 0; i < this.jobs.length; ++i)
        if (jobs[i].finished === false)
            return false;
    return true;
};

TSS.prototype.run = function() {
    if (this.mode === 'static') {
        this.runScheduler(jobs);
        return;
    }
    var eventQueue = new PriorityQueue();
    var i = 0;
    for (i = 0; i < jobs.length; ++ i){
        eventQueue.push(job, job.arrivalTime);
    }
    while (!this.finishedAllJobs()) {

        this.time = eventQueue.peek();
    }


};




