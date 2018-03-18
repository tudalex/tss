/**
 * Created by tudalex on 17/01/15.
 */
"use strict";

function fail(message) {
    throw new Error(message);
}

function assert(condition, message, cause) {
    if (!condition) {
        window.cause = cause;
        fail(message);
    }
}

class Random {
    constructor() {
        this.m_w = 123456789;
        this.m_z = 987654321;
        this.mask = 0xffffffff;
    }

// Takes any integer
    seed(i) {
        this.m_w = i;
        this.m_z = 987654321;
    }

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like this.random.random().
    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        var result = ((this.m_z << 16) + this.m_w) & this.mask;
        result /= 4294967296;
        return result + 0.5;
    }
}


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
            var leftHigher = (i * 2 + 1 == this.heap.length) || !this.isHigherPriority(i * 2 + 1, i * 2);
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
        //console.log("cmp " + i + " " + j);
        return this.heap[i].compareTo(this.heap[j]) > 0;
    }
};





var Stack = function(size) {
    this.a = new Array(size || 256);
    this.size = size;
    this.i = 0;
};

Stack.prototype = {
    push: function (e) {
        this.a[this.i++] = e;
    },

    pop: function () {
        return this.a[--this.i];
    },

    peek: function () {
        return this.a[this.i - 1];
    },

    isEmpty: function() {
        return this.i == 0;
    },

    clear: function () {
        this.i = 0;
    }
};


function Edge(src, dest, cost) {
    this.src = src;
    this.dst = dest;
    this.cost = cost;
}



function Job(w, id, req, dataNode, arrivalTime, tss) {
    this.id = id;
    this.w = w;
    this.succ = [];
    this.pred = [];
    this.req = [];
    this.remaining = w;
    this.tss = tss;
    if (req) {
        this.req = req;
    }
    this.dataNode = 0;

    if (dataNode) {
        this.dataNode = dataNode;
    }
    this.arrivalTime = 0;
    this.finished = false;
    this.log = [];
    this.reset();
}

Job.prototype = {
    addDep: function(job, cost) {
        if (job === null)
            return;
        var edge = new Edge(job, this, cost);
        job.succ.push(edge);
        this.pred.push(edge);
        this.remDeps += 1;
    },

    vizRow: function(dataTable) {
        var amplitude = 100;
        this.log.forEach(entry => {
            console.log(entry);
            dataTable.addRow([
                'Node ' + entry.node.id,
                this.id.toString(),
                entry.startTime * amplitude,
                (entry.startTime + entry.time) * amplitude
            ]);
        })

    },

    reset: function() {
        this.sl = -1;
        this.est = -1;
        this.lst = -1;

        this.startTime = -1;
        this.finish = -1;

        this.node = null;

        this.remDeps = this.pred.length;
        this.added = false;
        this.viz = false;
        this.remaining = this.w;
    },
    process: function (value) {
        this.remaining -= value;
        if (this.log.length > 0 && this.log[0].node.id === this.node.id) {
            this.log[0].time += 1;
        } else {
            this.log.push({
                node: this.node,
                startTime: tss.time,
                time: 1,
            })
        }
    },
    done: function () {
        this.finished = true;
        this.tss.jobsFinished += 1;
    }
};


function Node(id, queueTime) {
    this.id = id;
    this.defaultQueueTime = queueTime ? queueTime : 0;
    this.finish = this.defaultQueueTime;
    this.res = [1, 1, 1];
    this.jobsRunning = [];
}

Node.prototype = {
    reset: function() {
        this.finish = this.defaultQueueTime;
    },
    update: function () {
        const newRes = [1, 1, 1];
        this.jobsRunning.forEach((job) => {
            if (job.remaining <= 0) {
                job.done();
            } else {
                for (let i = 0; i < newRes.length; ++i) {
                    newRes[i] -= job.req[i];
                }
            }

        });
        this.jobsRunning = this.jobsRunning.filter(x => !x.finished);
        this.res = newRes;
    },
    tick: function () {
        this.jobsRunning.forEach((job) => {
            if (job.dataNode === this.id) {
                job.process(1);
            } else {
                job.process(0.9);
            }
        });
        this.update();
    }
};

function TSS(nodes) {
    this.time = 0;
    this.jobs = [];
    this.nodes = [];
    this.scheduler = null;
    this.jobsFinished = 0;
    this.random = new Random();
    this.random.seed(13);
    var i;
    for (i = 0; i < nodes; ++i) {
        this.nodes.push(new Node(i));
    }
}

TSS.prototype = {
    launchJobOnNode: function(node, job, startTime) {
        var i, djob, cost;
        if (!startTime) {
            startTime = this.time;
        }

        // assert(job.remDeps == 0, 'Not all dependencies are scheduled.', job);
        // assert(startTime >= node.finish, 'Node is already processing.', node);

        // for (i = 0; i < job.pred.length; ++i) {
        //     djob = job.pred[i].src;
        //     cost = djob.node == node ? 0 : job.pred[i].cost;
        //     assert(startTime >= djob.finish + cost, 'Job started before deps finished.');
        // }

        console.log("Launching job" + job.id + "on node" + node.id);

        // job.startTime = startTime;
        job.node = node;
        // node.finish = startTime + job.remaining;
        // job.finish = node.finish;

        for (i = 0; i < job.succ.length; ++i) {
            job.succ[i].dst.remDeps -= 1;
        }

        node.jobsRunning.push(job);
        node.update(this.time);
    },

    removeJobFromNoe: function(job) {
        const node = job.node;
        job.node = null;
        node.runningJobs = node.runningJobs.filter(x => x.id !== job.id);
    },

    dot: function (node, job) {
        let sum = 0;
        for (let i = 0; i < 3; ++i) {
            sum += node.res[i] * job.req[i];
        }
        return sum;
    },

    validNodes: function (job) {
        const nodes = [];
        var i, j, valid;
        for (i = 0; i < this.nodes.length; ++i) {
            valid = true;
            for (j = 0; j < this.nodes[i].res.length; ++j) {
                if (this.nodes[i].res[j] < job.req[j]) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                nodes.push(this.nodes[i]);
            }
        }
        return nodes;
    },
    
    availableJobs: function () {
        return this.jobs.filter(job => {
            return job.remaining > 0 && job.arrivalTime < this.time;
        })
    },

    setCode: function(code) {
        // WARNING! If you update this, update the function below also
        this.scheduler = new Function("tss", code);
    },

    preRunScheduler: function() {
        var l = this.jobs.length * 2;
        this.iStack = new Stack(l);
        this.nStack = new Stack(l);
        this.time = 0;
    },

    runScheduler: function() {
        this.preRunScheduler();
        var i;
        for (i = 0; i < 1000; ++i) {
            this.time += 1;
            this.nodes.forEach((node) => node.tick());
            this.scheduler(this);
            let allFinished = true;
            let j;
            for (j = 0; j < this.jobs.length; ++j) {
                if (!this.jobs[j].finished) {
                    allFinished = false;
                    break;
                }
            }
            // console.dir(this.jobs[j], {depth: 3, colors: true});

            if (allFinished) {
                break;
            }
        }
        console.log("done", i);
    },


    run: function() {
        this.runScheduler();
        //this.verify();
    },


    // DAG stuff

    generateRandomJobs: function(count) {
        var i, j, l,
            job;

        const scaleDistribution = (x, min, max) => {
            return Math.floor(x * (max - min + 1)) + min;
        }

        const getRandomInt = (min, max) => {
            return scaleDistribution(this.random.random(), min, max);
        }

        const getRandomIntExp = (min, max) => {
            return scaleDistribution(Math.pow(2, this.random.random()) - 1, min, max);
        }

        const getRandomElement = (a) => {
            if (a.length === 0)
                return null;
            return a[getRandomIntExp(0, a.length - 1)];
        }

        const getRequirements = () => {
            return [
                this.random.random(), // cpu
                this.random.random(), // mem
                this.random.random(), // network
            ];
        }

        this.jobs = [];
        for (i = 0; i < count; ++i) {
            job = new Job(getRandomInt(2, 100), i, getRequirements(), getRandomInt(0, this.nodes.length - 1), i * 2, this);
            l = getRandomInt(1, Math.min(10, this.jobs.length));
            // for (j = 0; j < l; ++j) {
            //     job.addDep(getRandomElement(this.jobs), getRandomInt(1, 10));
            // }
            this.jobs.push(job);
        }

        // Make exit node
        // job = new Job(0, count);
        // for (i = 0; i < count; ++i) {
        //     if (this.jobs[i].succ.length == 0)
        //         job.addDep(this.jobs[i], 0);
        // }
        this.jobs.push(job);

        this.entryJob = this.jobs[0];
        this.exitJob = this.jobs[this.jobs.length-1];
    },


    exportJobs: function() {
        var i, j, job, jobDep, entry;
        var entries = [this.jobs.length, this.entryJob.id, this.exitJob.id];
        for (i = 0; i < this.jobs.length; ++i) {
            job = this.jobs[i];
            entry = [job.id, job.w];
            for (j = 0; j < job.pred.length; ++j) {
                jobDep = job.pred[j];
                entry.push([jobDep.src.id, jobDep.cost]);
            }
            entries.push(entry);
        }
        return entries;
    },


    importJobs: function(entries) {
        var i, j, entry, jobDepEntry, jobId, jobW,
            numJobs = entries[0],
            entryJobId = entries[1],
            exitJobId = entries[2];


        this.jobs = new Array(numJobs);
        for (i = 0; i < numJobs; ++i) {
            this.jobs[i] = new Job(-1, i);
        }

        for (i = 3; i < entries.length; ++i) {
            entry = entries[i];
            jobId = entry[0];
            jobW = entry[1];
            this.jobs[jobId].w = jobW;
            for (j = 2; j < entry.length; ++j) {
                jobDepEntry = entry[j];
                this.jobs[jobId].addDep(this.jobs[jobDepEntry[0]], jobDepEntry[1]);
            }
        }
    },








    // DFS stuff

    dfs: function(entry, getNodeNeighLen, getNodeIthNeigh, processNode) {

        this.iStack.clear();
        this.nStack.clear();

        this.iStack.push(0);
        this.nStack.push(entry);

        var i, n;

        while (!this.iStack.isEmpty()) {

            i = this.iStack.pop();
            n = this.nStack.pop();

            if (n.viz) {
                continue;
            }

            if (i == getNodeNeighLen(n)) {
                processNode(n);
                n.viz = true;
                continue;
            }

            this.iStack.push(i+1);
            this.nStack.push(n);

            this.iStack.push(0);
            this.nStack.push(getNodeIthNeigh(n, i));
        }
    },

    getNodePredLen:     function(n)    { return n.pred.length;    },
    getNodeIthPred:     function(n, i) { return n.pred[i].src;    },
    getNodeIthPredCost: function(n, i) { return n.pred[i].cost;   },

    getNodeSuccLen:     function(n)    { return n.succ.length;    },
    getNodeIthSucc:     function(n, i) { return n.succ[i].dst;    },
    getNodeIthSuccCost: function(n, i) { return n.succ[i].cost;   },




    // Reset stuff

    reset: function() {
        var i;
        for (i = 0; i < this.jobs.length; ++i) {
            this.jobs[i].reset();
        }
        for (i = 0; i < this.nodes.length; ++i) {
            this.nodes[i].reset();
        }
    },

    resetVizJobs: function() {
        var i;
        for (i = 0; i < this.jobs.length; ++i) {
            this.jobs[i].viz = false;
        }
    },



    // Stats

    computeMakeSpan: function() {
        var i;
        var m = 0;
        for (i = 0; i < this.jobs.length; ++i) {
            m = m < this.jobs[i].finish ? this.jobs[i].finish : m;
        }
        return m;
    },

    computeFlowTime: function() {
        var i,
            sum = 0;
        for (i = 0; i < this.jobs.length; ++i) {
            sum += this.jobs[i].finish;
        }
        return sum;
    },


    utils: {
        PriorityQueue: PriorityQueue,
        Stack: Stack,
        dot: function (a, b) {
                var sum = 0;
                for (var i in a) {
                    sum += a[i] * b[i];
                }
                return sum;
            }
    }
};

if (typeof require != 'undefined' && require.main === module) {
    const _ = require("lodash");
    var tss  = new TSS(2);
    tss.generateRandomJobs(10);
    // console.log(tss.jobs);
    tss.scheduler = function () {

        const jobs = tss.availableJobs();
        const unscheduledJobs = jobs.filter(x => !x.node);
        // console.log(unscheduledJobs.length);
        unscheduledJobs.forEach(job => {
            const validNodes = tss.validNodes(job);
            // const nodes = validNodes;
            // console.log(job, validNodes);
            const nodes = _(validNodes).map(node => ({
                node: node,
                score: tss.dot(node, job)
            })).sortBy('score').reverse().map(x => x.node).value();
            // console.log(nodes);
            if (nodes.length > 0) {
                tss.launchJobOnNode(nodes[0], job)
            }
        })
    }

    tss.reset();
    tss.run();
    console.log(tss.computeMakeSpan())
    console.log(tss.computeFlowTime())
    // console.dir(tss.jobs, { colors: true, depth: 4});
}



