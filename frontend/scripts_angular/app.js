// Application du site euro2016Predictions
var euro2016Predictions = angular.module('euro2016Predictions', ['chieffancypants.loadingBar', 'ngRoute'])
                                    .config(function (cfpLoadingBarProvider) {
                                        cfpLoadingBarProvider.includeSpinner = true;
                                    });

/* Définition des controllers à l'application */
euro2016Predictions.controller('LoginController', LoginController);

/*  Interceptor des réponses HTTP  pour l'auth  */
euro2016Predictions.factory('AuthInterceptor', AuthInterceptor);

/* Définition des factory */ 
euro2016Predictions.factory('UserService', UserService);
									

var config = function($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider
    .when('/welcome', {
      templateUrl:'/views/welcome.html',
	  authorized: false
    })
	.when('/pronostic', {
      templateUrl:'/views/pronostic.html',
	  authorized: true
    })
	.when('/ranks', {
      templateUrl:'/views/ranks.html',
	  authorized: false
    })
    .when('/login', {
      controller:'LoginController',
      templateUrl:'/views/login.html',
	  authorized: false
    })
    .when('/input-scores', {
      templateUrl:'input-scores.html'
    })
	.when('/signup', {
		templateUrl:'/views/signup.html',
	  authorized: false
	})
    .otherwise({
      redirectTo:'/welcome'
    });
	
    $httpProvider.interceptors.push('AuthInterceptor');
}
config.$inject = ['$routeProvider', '$locationProvider', '$httpProvider'];
euro2016Predictions.config(config);

euro2016Predictions.run(['$rootScope', '$location', 'UserService', function($rootScope, $location, UserService) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
			if (next.authorized  && !UserService.isConnected()) {
				$location.url("login");
        }
    });
}]);

