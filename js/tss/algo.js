/**
 * Created by mircea on 1/19/15.
 */

"use strict";

var computeSL = function(entry, exit) {

    var getNodeNeighLen = tss.getNodeSuccLen,
        getNodeIthNeigh = tss.getNodeIthSucc,
        getNodeIthCost  = tss.getNodeIthSuccCost;

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

    tss.dfs(entry, getNodeNeighLen, getNodeIthNeigh, processNode);
};


var computeEST = function(entry, exit) {

    var getNodeNeighLen = tss.getNodePredLen,
        getNodeIthNeigh = tss.getNodeIthPred,
        getNodeIthCost  = tss.getNodeIthPredCost;

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

    tss.dfs(exit, getNodeNeighLen, getNodeIthNeigh, processNode);
};


var computeLST = function(entry, exit) {

    var getNodeNeighLen = tss.getNodeSuccLen,
        getNodeIthNeigh = tss.getNodeIthSucc,
        getNodeIthCost  = tss.getNodeIthSuccCost;

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

    tss.dfs(entry, getNodeNeighLen, getNodeIthNeigh, processNode);
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
                minStartNode = node;
            }
        }
        tss.launchJobOnNode(minStartNode, job, minStart);
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
    tss.resetVizJobs();
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
    this.computeStart();
    this.idx = -1;
};

SchedPair.prototype = {
    computeStart: function () {
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
        this.start = start;
    },

    compareTo: function (other) {
        if (this.start == other.start) {
            // select job with higher sl
            return this.job.sl - other.job.sl;
        }
        // select pair with lower starting time
        return other.start - this.start;
    },

    updateStart: function () {
        if (this.node.finish > this.start) {
            this.start = this.node.finish;
            return true;
        }
        return false;
    }
};




var ETF = function(jobs, entryJob, exitJob, nodes) {
    computeSL(entryJob, exitJob);

    var i,
        jobId, pair, opair, jobDep;

    var pq = new tss.utils.PriorityQueue();
    var jobset = Object.create(null);

    var addSchedPairs = function(job) {
        var i, node, pair;

        // add job to set
        jobset[job.id] = job;

        // add all the pairs in the pq
        job.schedPairs = new Array(nodes.length);

        job.added = true;

        for (i = 0; i < nodes.length; ++i) {
            node = nodes[i];
            pair = new SchedPair(node, job);
            pq.push(pair);
            job.schedPairs[i] = pair;
        }
    };

    addSchedPairs(entryJob);

    while (!pq.isEmpty()) {
        pair = pq.pop();
        delete jobset[pair.job.id];

        assert(!pair.updateStart(), "Pq failed, start time should be already updated");

        tss.launchJobOnNode(pair.node, pair.job, pair.start);

        for (i = 0; i < nodes.length; ++i) {
            opair = pair.job.schedPairs[i];
            if (opair.idx < 0) {
                // was popped
                continue;
            }
            pq.remove(opair.idx);
        }
        pair.job.schedPairs = [];

        for (jobId in jobset) {
            opair = jobset[jobId].schedPairs[pair.node.id];
            if (opair.updateStart()) {
                pq.sink(opair.idx);
            }
        }

        for (i = 0; i < pair.job.succ.length; ++i) {
            jobDep = pair.job.succ[i];
            if (jobDep.dst.remDeps == 0 && !jobDep.dst.added) {
                addSchedPairs(jobDep.dst);
            }
        }
    }
};

// var run = function(algo) {
//     algo(tss.jobs, tss.entryJob, tss.exitJob, tss.nodes);
// };

//run(HLFET);
// run(MCP);
// run(ETF);


const jobs = tss.availableJobs();
const unscheduledJobs = jobs.filter(x => !x.node);
console.log(unscheduledJobs.length);
unscheduledJobs.forEach(job => {
    const validNodes = tss.validNodes(job);
    const nodes = validNodes;
    // console.log(job, validNodes);
    // const nodes = _(validNodes).map(node => ({
    //     node: node,
    //     score: tss.dot(node, job)
    // })).sortBy('score').reverse().values();
    if (nodes.length > 0) {
        tss.launchJobOnNode(nodes[0], job)
    }
})