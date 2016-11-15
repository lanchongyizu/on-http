// Copyright 2015, EMC, Inc.

'use strict';

var di = require('di'),
    express = require('express');

module.exports = nodesRouterFactory;

di.annotate(nodesRouterFactory, new di.Provide('Http.Api.Internal.Nodes'));
di.annotate(nodesRouterFactory,
    new di.Inject(
	    'Services.Waterline',
	    'Http.Services.Api.Workflows',
	    'Protocol.Task',
	    'Services.Lookup',
	    'Promise',
	    'common-api-presenter'
	)
);

function nodesRouterFactory (
    waterline,
    workflowApiService,
    taskProtocol,
    lookupService,
    Promise,
    presenter
) {
    var router = express.Router();

    /**
     * @api {get} /api/1.1/nodes/:identifier/templates/:templateName
     *                                 GET /:identifier/templates/:templateName
     * @apiVersion 1.1.0
     * @apiDescription used internally by the system -- will NOT the template with the
     *                                 <code>templateName</code>, use /api/current/templates/library
     * @apiName get-node-template
     * @apiGroup nodes
     */

    router.get('/nodes/:identifier/templates/:templateName', function (req, res) {
         var nodeId = req.params.identifier;
         return workflowApiService.findActiveGraphForTarget(nodeId)
         .then(function(taskGraphInstance) {
             if (taskGraphInstance) {
                 return Promise.props({
                     options: taskProtocol.requestProperties(nodeId),
                     context: taskGraphInstance.context
                 });
             } else {
                 return Promise.reject(
                     new Error("Unable to find active graph for node " +
                     nodeId + " for properties request."));
             }
         })
        .then(function (properties) {
            presenter(req, res)
                .renderTemplate(
                    req.params.templateName,
                    properties.options,
                    200,
                    properties.context
                );
        })
        .catch(function (err) {
            presenter(req, res).renderError(err);
        });
    });

    return router;
}
