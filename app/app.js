'use strict';
/**
* Declare app level module which depends on filters, and services
* 
* Declaration of angular app and its routing. Include all services and other module that are used for angular
*
* LICENSE: Some license information
*
* @category LiquidMap - Angularjs
* @package Angular App
* @subpackage app
* @version  $Id:$v.1.0
* @date 29-09-2014
* @author debugger@hotmail.co.uk
*/

var app = angular.module('applineup', ['ngMap','ngRoute', 'ngCookies']); 
   
app.config(function($routeProvider, $locationProvider) {
    $routeProvider.
            when('/', {
                templateUrl: 'search.html',
                controller: searchCtrl     
            });   
});
