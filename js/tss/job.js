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



function Job(w, id) {
    this.id = id;
    this.w = w;
    this.succ = [];
    this.pred = [];
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

    vizRow: function() {
        var amplitude = 100;
        return [
            'Node ' + this.node.id,
            this.id.toString(),
            this.startTime * amplitude,
            (this.startTime + this.w) * amplitude
        ];
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
    }
};

function Node(id, queueTime) {
    this.id = id;
    this.defaultQueueTime = queueTime ? queueTime : 0;
    this.finish = this.defaultQueueTime;
}

Node.prototype = {
    reset: function() {
        this.finish = this.defaultQueueTime;
    }
};

function TSS(nodes) {
    this.time = 0;
    this.jobs = [];
    this.nodes = [];
    this.scheduler = null;

    var i;
    for (i = 0; i < nodes; ++i) {
        this.nodes.push(new Node(i));
    }
}

TSS.prototype = {
    launchJobOnNode: function(node, job, startTime) {
        var i, djob, cost;

        assert(job.remDeps == 0, 'Not all dependencies are scheduled.', job);
        assert(startTime >= node.finish, 'Node is already processing.', node);

        for (i = 0; i < job.pred.length; ++i) {
            djob = job.pred[i].src;
            cost = djob.node == node ? 0 : job.pred[i].cost;
            assert(startTime >= djob.finish + cost, 'Job started before deps finished.');
        }

        job.startTime = startTime;
        job.node = node;
        node.finish = startTime + job.w;
        job.finish = node.finish;

        for (i = 0; i < job.succ.length; ++i) {
            job.succ[i].dst.remDeps -= 1;
        }
    },

    setCode: function(code) {
        // WARNING! If you update this, update the function below also
        this.scheduler = new Function("tss", code);
    },

    preRunScheduler: function() {
        var l = this.jobs.length * 2;
        this.iStack = new Stack(l);
        this.nStack = new Stack(l);
    },

    runScheduler: function() {
        this.preRunScheduler();
        this.scheduler(this);
    },


    run: function() {
        this.runScheduler();
        //this.verify();
    },


    // DAG stuff

    generateRandomJobs: function(count) {
        var i, j, l,
            job;

        function scaleDistribution(x, min, max) {
            return Math.floor(x * (max - min + 1)) + min;
        }

        function getRandomInt(min, max) {
            return scaleDistribution(Math.random(), min, max);
        }

        function getRandomIntExp(min, max) {
            return scaleDistribution(Math.pow(2, Math.random()) - 1, min, max);
        }

        function getRandomElement(a) {
            if (a.length === 0)
                return null;
            return a[getRandomIntExp(0, a.length - 1)];
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

        // Make exit node
        job = new Job(0, count);
        for (i = 0; i < count; ++i) {
            if (this.jobs[i].succ.length == 0)
                job.addDep(this.jobs[i], 0);
        }
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
        Stack: Stack
    }
};







