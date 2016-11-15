// Copyright 2015, EMC, Inc.
/* jshint node:true */

'use strict';

describe('Http.Api.Templates', function () {
    var templates;
    var lookupService;
    var workflowApiService;
    var waterline;
    var environment;

    before('start HTTP server', function () {
        this.timeout(5000);
        templates = {
            load: sinon.stub()
        };
        workflowApiService = {};
        waterline = {
            start: sinon.stub(),
            stop: sinon.stub(),
            lookups: {
                setIndexes: sinon.stub()
            }
        };
        environment = {
            start: sinon.stub(),
            stop: sinon.stub(),
            get: sinon.stub()
        };

        return helper.startServer([
            dihelper.simpleWrapper(templates, 'Templates'),
            dihelper.simpleWrapper(workflowApiService, 'Http.Services.Api.Workflows'),
            dihelper.simpleWrapper(waterline, 'Services.Waterline'),
            dihelper.simpleWrapper(environment, 'Services.Environment')
        ]);
    });

    after('stop HTTP server', function () {
        return helper.stopServer();
    });

    beforeEach('set up mocks', function () {
        templates.getAll = sinon.stub().resolves();
        templates.get = sinon.stub().resolves();
        templates.put = sinon.stub().resolves();

        lookupService = helper.injector.get('Services.Lookup');
        lookupService.ipAddressToMacAddress = sinon.stub().resolves();
        lookupService.ipAddressToNodeId = sinon.stub().resolves();
        workflowApiService.findActiveGraphForTarget = sinon.stub().resolves();
        waterline.nodes = {
            findByIdentifier: sinon.stub().resolves()
        };
        environment.get.resolves({});
    });

    var template = {
        id: '1234abcd5678effe9012dcba',
        name: 'dummy template',
        contents: 'reboot\n'
    };

    describe('GET /templates/library', function () {
        it('should return a list of templates', function () {
            templates.getAll.resolves([template]);
            templates.get.resolves(template);
            return helper.request().get('/api/1.1/templates/library')
            .expect('Content-Type', /^application\/json/)
            .expect(200, [template])
            .then(function () {
                expect(templates.getAll).to.have.been.calledOnce;
            });
        });
    });


    describe('GET /templates/library/:id', function () {
        it('should return a single template', function () {
            templates.get.resolves(template);
            return helper.request().get('/api/1.1/templates/library/123')
            .expect('Content-Type', /^application\/json/)
            .expect(200, template)
            .then(function () {
                expect(templates.get).to.have.been.calledOnce;
                expect(templates.get).to.have.been.calledWith('123');
            });
        });

        it('should return a single template with scope', function () {
            templates.get.resolves(template);
            return helper.request().get('/api/1.1/templates/library/123?scope=abc')
            .expect('Content-Type', /^application\/json/)
            .expect(200, template)
            .then(function () {
                expect(templates.get).to.have.been.calledOnce;
                expect(templates.get).to.have.been.calledWith('123','abc');
            });
        });

        it('should not return a single template with invalid scope', function () {
            templates.get.resolves(undefined);
            return helper.request().get('/api/1.1/templates/library/123?scope=noop')
            .expect('Content-Type', /^application\/json/)
            .expect(404)
            .then(function () {
                expect(templates.get).to.have.been.calledOnce;
                expect(templates.get).to.have.been.calledWith('123', 'noop');
            });
        });

    });

    describe('PUT /templates/library/:id', function () {
        it('should save a template (octet-stream)', function () {
            templates.put.resolves();
            return helper.request().put('/api/1.1/templates/library/123')
            .set('Content-Type', 'application/octet-stream')
            .send('test_template_cmd\n')
            .expect(200)
            .then(function () {
                expect(templates.put).to.have.been.calledOnce;
                expect(templates.put).to.have.been.calledWith('123');
            });
        });


        it('should save a template (text/plain)', function () {
            templates.put.resolves();
            return helper.request().put('/api/1.1/templates/library/123')
            .set('Content-Type', 'text/plain')
            .send('test_template_cmd\n')
            .expect(200)
            .then(function () {
                expect(templates.put).to.have.been.calledOnce;
                expect(templates.put).to.have.been.calledWith('123');
            });
        });

        it('should 500 error when templates.put() fails', function () {
            templates.put.rejects(new Error('dummy'));
            return helper.request().put('/api/1.1/templates/library/123')
            .send('test_template_cmd\n')
            .expect('Content-Type', /^application\/json/)
            .expect(500);
        });
    });
});
