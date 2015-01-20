/**
* Created by mircea on 1/19/15.
*/



var Stack = function(size) {
    this.a = new Array(size || 256);
    this.size = size;
    this.i = 0;
};

Stack.prototype.push = function(e) {
    this.a[this.i++] = e;
};

Stack.prototype.pop = function() {
    return this.a[--this.i];
};

Stack.prototype.peek = function() {
    return this.a[this.i-1];
};

Stack.prototype.clear = function() {
    this.i = 0;
};


var iStack = new Stack(1024);
var nStack = new Stack(1024);

var dfs = function(entry, getNodeNeighLen, getNodeIthNeigh, processNode) {

    iStack.clear();
    nStack.clear();

    iStack.push(0);
    nStack.push(entry);

    var i, n;

    while (iStack.i) {

        i = iStack.pop();
        n = nStack.pop();

        if (n.viz) {
            continue;
        }

        if (i == getNodeNeighLen(n)) {
            processNode(n);
            n.viz = true;
            continue;
        }
        console.log('Neigh i',getNodeIthNeigh(n, i));

        iStack.push(i+1);
        nStack.push(n);

        iStack.push(0);
        nStack.push(getNodeIthNeigh(n, i));
    }
};


var getNodePredLen      = function(n)    { return n.pred.length;    };
var getNodeIthPred      = function(n, i) { return n.pred[i].src;    };
var getNodeIthPredCost  = function(n, i) { return n.pred[i].cost;   };

var getNodeSuccLen      = function(n)    { return n.succ.length;    };
var getNodeIthSucc      = function(n, i) { return n.succ[i].dst;    };
var getNodeIthSuccCost  = function(n, i) { return n.succ[i].cost;   };


var resetViz = function(nodes) {
    var i;
    for (i = 0; i < nodes.length; ++i) {
        nodes[i].viz = false;
    }
};


var computeSL = function(entry, exit) {

    var getNodeNeighLen = getNodeSuccLen,
        getNodeIthNeigh = getNodeIthSucc,
        getNodeIthCost  = getNodeIthSuccCost;

    var processNode = function(n) {
        var neighLen = getNodeNeighLen(n);
        var i, neigh, v;
        var sl = 0;
        for (i = 0; i < neighLen; ++i) {
            neigh = getNodeIthNeigh(n, i);
            v = neigh.sl;
            if (v > sl) {
                sl = v;
            }
        }
        n.sl = sl + n.w;
    };

    exit.sl = exit.w;
    exit.viz = true;

    dfs(entry, getNodeNeighLen, getNodeIthNeigh, processNode);
};

var computeEST = function(entry, exit) {

    var getNodeNeighLen = getNodePredLen,
        getNodeIthNeigh = getNodeIthPred,
        getNodeIthCost  = getNodeIthPredCost;

    var processNode = function(n) {
        var neighLen = getNodeNeighLen(n);
        var i, neigh, v;
        var est = 0;
        for (i = 0; i < neighLen; ++i) {
            neigh = getNodeIthNeigh(n, i);
            v = neigh.est + neigh.w + getNodeIthCost(n, i);
            if (v > est) {
                est = v;
            }
        }
        n.est = est;
    };

    entry.est = 0;
    entry.viz = true;

    dfs(exit, getNodeNeighLen, getNodeIthNeigh, processNode);
};

var computeLST = function(entry, exit) {

    var getNodeNeighLen = getNodeSuccLen,
        getNodeIthNeigh = getNodeIthSucc,
        getNodeIthCost  = getNodeIthSuccCost;

    var processNode = function(n) {
        var neighLen = getNodeNeighLen(n);
        var i, neigh, v;
        var lst = 4294967295;
        for (i = 0; i < neighLen; ++i) {
            neigh = getNodeIthNeigh(n, i);
            v = neigh.lst - getNodeIthCost(n, i);
            if (v < lst) {
                lst = v;
            }
        }
        n.lst = lst - n.w;
    };

    exit.lst = exit.est;
    exit.viz = true;

    dfs(entry, getNodeNeighLen, getNodeIthNeigh, processNode);
};



var staticAssign = function(jobs, nodes) {
    var i, j, k, v,
        job, jobDep, node,
        start,
        minStart,
        minStartNode;

    // iterate over jobs
    for (i = 0; i < jobs.length; ++i) {
        job = jobs[i];
        minStart = 4294967295;

        // iterate over nodes
        for (j = 0; j < nodes.length; ++j) {
            node = nodes[j];
            start = node.finish;
            console.log('Rem Deps:',job.remDeps);

            // iterate over dependencies
            for (k = 0; k < job.pred.length; ++k) {
                jobDep = job.pred[k];
                v = jobDep.src.finish;
                if (jobDep.src.node.id != j) {
                    v += jobDep.cost;
                }
                if (v > start) {
                    start = v;
                }
            }

            if (start < minStart) {
                minStart = start;
                minStartNode = j;
            }
        }

        launchJobOnNode(nodes[minStartNode], job, minStart);
    }
};



var HLFET = function(jobs, entryJob, exitJob, nodes) {
    computeSL(entryJob, exitJob);
    jobs.sort(function(a, b) {
        return b.sl - a.sl;
    });

    staticAssign(jobs, nodes);
};

var MCP = function(jobs, entryJob, exitJob, nodes) {
    computeEST(entryJob, exitJob);
    resetViz(jobs);
    computeLST(entryJob, exitJob);

    var i, j, job;
    for (i = 0; i < jobs.length; ++i) {
        job = jobs[i];
        job.lstLst = new Array(job.succ.length + 1);
        for (j = 0; j < job.succ.length; ++j) {
            job.lstLst[j] = job.succ[j].dst.lst;
        }
        job.lstLst[job.succ.length] = job.lst;


        job.lstLst.sort(function (a, b) {
            return a-b;
        });
        console.log('Lst',job.lst);
        console.log(job.lstLst[0]);
    }

    jobs.sort(function(a, b) {
        var i, l = Math.min(a.lstLst.length, b.lstLst.length);

        for (i = 0; i < l; ++i) {
            if (a.lstLst[i] != b.lstLst[i]) {
                return a.lstLst[i] - b.lstLst[i];
            }
        }
        return a.lstLst.length - b.lstLst.length;
    });

    staticAssign(jobs, nodes);
};


var SchedPair = function(node, job) {
    this.node = node;
    this.job = job;
    this.start = this.computeStart();
    this.idx = -1;
};

SchedPair.prototype.computeStart = function() {
    var i, v;
    var jobDep;
    var start = this.node.finish;
    for (i = 0; i < this.job.pred.length; ++i) {
        jobDep = this.job.pred[i];
        v = jobDep.src.finish;
        if (jobDep.src.node != this.node) {
            v += jobDep.cost;
        }
        if (v > start) {
            start = v;
        }
    }
    return start;
};

SchedPair.prototype.compareTo = function(other) {
    if (this.start == other.start) {
        // select job with higher sl
        return this.job.sl - other.job.sl;
    }
    // select pair with lower starting time
    return other.start - this.start;
};

SchedPair.prototype.updateStart = function() {
    if (this.node.finish > this.start) {
        this.start = this.node.finish;
        return true;
    }
    return false;
};




var ETF = function(jobs, entryJob, exitJob, nodes) {
    computeSL(entryJob, exitJob);


    var pq = new PriorityQueue();
    var jobs = Object.create(null);

    var addSchedPairs = function(job) {
        // add job to set
        jobs[job] = true;

        // add all the pairs in the pq
        job.schedPairs = new Array(nodes.length);

        var i;
        for (i = 0; i < nodes.length; ++i) {
            node = nodes[i];
            pair = new SchedPair(node, job);
            pq.push(pair);
            job.schedPairs[i] = pair;
        }
    };

    var i, j,
        node,
        job,
        pair,
        opair,
        jobDep;

    addSchedPairs(entryJob);

    console.log(pq.isEmpty());
    while (!pq.isEmpty()) {
        pair = pq.pop();
        delete jobs[pair.job];

        launchJobOnNode(pair.node, pair.job, pair.start);

        for (i = 0; i < nodes.length; ++i) {
            opair = pair.job.schedPairs[i];
            if (opair.idx < 0) {
                // was popped
                continue;
            }
            pq.remove(opair.idx);
        }
        pair.job.schedPairs = [];

        for (job in jobs) {
            pair = job.schedPairs[pair.node.id];
            if (pair.updateStart()) {
                pq.sink(pair.idx);
            }
        }

        for (i = 0; i < pair.job.succ.length; ++i) {
            jobDep = pair.job.succ[i];
            if (jobDep.dst.remDeps == 0) {
                addSchedPairs(jobDep.dst);
            }
        }
    }
};

HLFET(jobs, jobs[0], jobs[jobs.length - 1], nodes);
//MCP(jobs, jobs[0], jobs[jobs.length - 1], nodes);
//ETF(jobs, jobs[0], jobs[jobs.length - 1], nodes);