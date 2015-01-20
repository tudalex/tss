/**
 * Created by tudalex on 17/01/15.
 */
"use strict";
// Priority queue implementation from http://jsfiddle.net/GRIFFnDOOR/r7tvg/


// takes an array of objects with {data, priority}
function PriorityQueue(arr, comparator) {
    this.heap = [null];

    if (comparator) {
        this.isHigherPriority = function(i, j) {
            return comparator(this.heap[i], this.heap[j]) > 0;
        };
    }

    if (arr) {
        for (var i = 0; i < arr.length; i++)
            this.push(arr[i]);
    }
}

PriorityQueue.prototype = {
    push: function(node) {
        var idx = this.heap.push(node) - 1;
        node.idx = idx;
        this.bubble(idx);
    },

    isEmpty: function() {
        return this.heap.length <= 1;
    },

    // removes and returns the data of highest priority
    pop: function() {
        return this.remove(1);
    },

    peek: function() {
        var topVal = this.heap[1];
        return topVal;
    },

    // bubbles node i up the binary tree based on
    // priority until heap conditions are restored
    bubble: function(i) {
        while (i > 1) {
            var parentIndex = i >> 1; // <=> floor(i/2)

            // if equal, no bubble (maintains insertion order)
            if (!this.isHigherPriority(i, parentIndex))
                break;

            this.swap(i, parentIndex);
            i = parentIndex;
        }
    },

    // does the opposite of the bubble() function
    sink: function(i) {
        while (i * 2 < this.heap.length) {
            // if equal, left bubbles (maintains insertion order)
            var leftHigher = !this.isHigherPriority(i * 2 + 1, i * 2);
            var childIndex = leftHigher ? i * 2 : i * 2 + 1;

            // if equal, sink happens (maintains insertion order)
            if (this.isHigherPriority(i, childIndex))
                break;

            this.swap(i, childIndex);
            i = childIndex;
        }
    },

    remove: function(i) {
        this.swap(i, this.heap.length-1);
        var e = this.heap.pop();
        e.idx = -1;
        this.sink(i);
        return e;
    },

    // swaps the addresses of 2 nodes
    swap: function(i, j) {
        var temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;

        this.heap[i].idx = i;
        this.heap[j].idx = j;
    },

    // returns true if node i is higher priority than j
    isHigherPriority: function(i, j) {
        return this.heap[i].compareTo(this.heap[j]) > 0;
    }
};

function Edge(src, dest, cost) {
    this.src = src;
    this.dst = dest;
    this.cost = cost;
}

function Job(executionTime, id) {
    this.id = id;
    this.startTime = -1;
    this.executionTime = executionTime;
    this.w = executionTime;
    this.succ = [];
    this.pred = [];
    this.nodeId = -1;
    this.viz = false;
    this.sl = -1;
    this.est = -1;
    this.lst = -1;
    this.remDeps = 0;
    this.node = undefined;
    this.finish = -1;
    this.added = false;
}

Job.prototype.addDep = function (job, cost) {
    if (job === null)
        return;
    var edge = new Edge(job, this, cost);
    job.succ.push(edge);
    this.pred.push(edge);
    this.remDeps += 1;
};

Job.prototype.vizRow = function() {
    var amplitude = 100;
    return [
        'Processing element '+this.nodeId,
        this.id.toString(),
        this.startTime * amplitude,
        (this.startTime + this.executionTime) * amplitude
    ];
};

Job.prototype.reset = function() {
    this.startTime = -1;
    this.nodeId = -1;
    this.viz = false;
    this.sl = -1;
    this.est = -1;
    this.lst = -1;
    this.remDeps = this.pred.length;
    this.node = undefined;
    this.finish = -1;
    this.added = false;
};

function Node(id, queueTime) {
    this.id = id;
    this.defaultQueueTime = queueTime ? queueTime : 0;
    this.finish = this.defaultQueueTime;
}

Node.prototype.reset = function() {
    this.finish = this.defaultQueueTime;
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

TSS.prototype.launchJobOnNode = function(node, job, startTime) {
    var i, djob, cost;
    if (job.remDeps != 0)
        throw new Error('Not all dependencies are scheduled. Remaining '+job.remDeps+' dependencies.');
    if (node.finish > startTime)
        throw new Error('Node is already processing.');
    for (i = 0; i < job.pred.length; ++i) {
        djob = job.pred[i].src;
        cost = djob.nodeId === node.id ? 0 : job.pred[i].cost;
        if (djob.finish + cost > startTime)
            throw  new Error('Job started before deps finished.');
    }

    job.startTime = startTime;
    job.nodeId = node.id;
    job.node = node;
    node.finish  = startTime + job.executionTime;
    job.finish = node.finish;

    for (i = 0; i < job.succ.length; ++i) {
        job.succ[i].dst.remDeps -= 1;
    }
};

TSS.prototype.setCode = function(code) {
    // WARNING! If you update this, update the function below also
    this.scheduler = new Function("jobs", "nodes", "launchJobOnNode", "PriorityQueue", code);
};

TSS.prototype.runScheduler = function(jobs) {
    this.scheduler(jobs, this.nodes, this.launchJobOnNode.bind(this), PriorityQueue);
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
    this.jobs = [];
    for (i = 0; i < count; ++i) {
        job = new Job(getRandomInt(1, 100), i);
        l = getRandomInt(1, Math.min(10, this.jobs.length));
        for (j = 0; j < l; ++j) {
            job.addDep(getRandomElement(this.jobs), getRandomInt(1, 10));
        }
        this.jobs.push(job);
    }
    job = new Job(0, count);
    for (i = 0; i < count; ++i)
        if (this.jobs[i].succ.length == 0)
            job.addDep(this.jobs[i], getRandomInt(1, 10));
    this.jobs.push(job);

};

TSS.prototype.run = function() {
    this.runScheduler(this.jobs);
    //this.verify();
    return;
};

TSS.prototype.reset = function() {
    var i;
    for (i = 0; i < this.jobs.length; ++i)
        this.jobs[i].reset();
    for (i = 0; i < this.nodes.length; ++i)
        this.nodes[i].reset();
};

TSS.prototype.makeSpan = function() {
    var i;
    var m = 0;
    for (i = 0; i < this.jobs.length; ++i) {
        m = m < this.jobs[i].finish ? this.jobs[i].finish : m;
    }
    return m;
};

TSS.prototype.flowTime = function() {
    var i;
    var sum = 0;
    for (i = 0; i < this.jobs.length; ++i) {
        sum += this.jobs[i].finish;
    }
    return sum;
};






