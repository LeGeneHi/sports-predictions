/**
* Angular Controller -> LoginController  
* Login user in euro2016 Predictor
* login() * Try to log in user input
**/
var LoginController = function($scope, $route, $routeParams, $location, UserService) {
    
	$scope.User = {
        Login: '',
        Password: ''
    };
			
    $scope.login = function() {
		var res = UserService.login($scope.User.Login, $scope.User.Password);
		
		 res.then(function (result) {
            if (result.User != null  && result.User.status != 200) {
				$scope.returnRequest = result.User.message;
            }
			else
				$location.path('pronostic');
        });
    }   
}
LoginController.$inject = ['$scope', '$route', '$routeParams', '$location', 'UserService'];

/**
* Angular Controller -> SignupController  
* Sign up new user in euro2016 Predictor
* save() * Try to create a new user
* loginChanged() * Use this method to control email availability
* setResponse(), setWidgetId() et cbExpiration() * Recaptcha implementation
**/
var SignupController = function($scope, $route, $routeParams, $location, UserService, vcRecaptchaService, Notification) {
    
	// Implementation recaptcha
	$scope.response = null;
    $scope.widgetId = null;

    $scope.model = {
        key: '6LdiSh8TAAAAADLasplj5tGB390M6qBzH24vmXED'
    };
	
	$scope.newuser = {
        Login: '',
		Name: '',
        Password: '',
		login_available: null
    };

    $scope.setResponse = function (response) {
        $scope.response = response;
    };

    $scope.setWidgetId = function (widgetId) {
        $scope.widgetId = widgetId;
    };
	
	$scope.cbExpiration = function() {
		vcRecaptchaService.reload($scope.widgetId);
		$scope.response = null;
    };
				 			 		
	$scope.loginChanged = function(){
		   
		$scope.returnRequest = '';
		$scope.newuser.login_available = true;
		var res = UserService.loginAvailable($scope.newuser.Login);
		res.then(function (result) {
			if (!result.Result) {
				$scope.returnRequest = 'Cette adresse mail est déjà utilisée !';
				$scope.newuser.login_available = false;	
			}
		});

	}
				
    $scope.save = function() {
		if($scope.newuser.login_available)
		{
			var res = UserService.signup($scope.newuser.Login, $scope.newuser.Name, $scope.newuser.Password, $scope.response);
			
			 res.then(function (result) {
				if (result.User != null  && result.User.status === 500) 
					Notification.error({message: result.User.message, title: 'Erreur lors de l\'enregistrement'});
				else if(result.User != null  && result.User.status === 204)
				{
					Notification.success({message: 'Merci de vous connecter à l\'application afin d\'accèder au concours de pronostique.', title: 'Enregistrement effectué'});
					$location.path('/');
					openModal();
				}
			});
		}
		else
			alert('Cette adresse mail est incorrecte !');
    }
}
SignupController.$inject = ['$scope', '$route', '$routeParams', '$location', 'UserService', 'vcRecaptchaService', 'Notification'];

/**
* Angular Controller -> PronosticController  
* Save and Get prediction data in euro2016 Predictor
* init() * Get data prediction with games data
* submitPronostic() * Save predictions
**/
var PronosticController = function($scope, $location, UserService, PredictionService, GamesService, Notification, $linq){

	$scope.games = [];

	$scope.tabs = [{ title:'Groupe A', content:'<div class="item active"><h3 class="group-name">Groupe A</h3><hr/><pronostic ng-repeat="match in games | filter:\'Groupe A\'" match="match"></pronostic></div>'},
		{ title:'Groupe B', content:'<div class="item"><h3 class="group-name">Groupe B</h3><hr/><pronostic ng-repeat="match in games | filter:\'Groupe B\'" match="match"></pronostic></div>'},
		{ title:'Groupe C', content:'<div class="item"><h3 class="group-name">Groupe C</h3><hr/><pronostic ng-repeat="match in games | filter:\'Groupe C\'" match="match"></pronostic></div>'},
		{ title:'Groupe D', content:'<div class="item"><h3 class="group-name">Groupe D</h3><hr/><pronostic ng-repeat="match in games | filter:\'Groupe D\'" match="match"></pronostic></div>'},
		{ title:'Groupe E', content:'<div class="item"><h3 class="group-name">Groupe E</h3><hr/><pronostic ng-repeat="match in games | filter:\'Groupe E\'" match="match"></pronostic></div>'},
		{ title:'Groupe F', content:'<div class="item"><h3 class="group-name">Groupe F</h3><hr/><pronostic ng-repeat="match in games | filter:\'Groupe F\'" match="match"></pronostic></div>'}];

	$scope.init = function(){
		
		var error = false;
		$scope.games = [];
		var res = GamesService.getGroupGames();
		res.then(function (result) {
			if(result.Games  != null && result.Games != undefined)
				$scope.games = result.Games;
			else{
				Notification.error({message: 'Les scores des matches n\'ont pu être récupérés. Un problème technique est à l\'origine du problème.', title: 'Erreur'});
				error = true;
			}
		});
		
		if(error){
			$scope.games = [];
			return ;
		}
			
		PredictionService.getPredictions(UserService.getToken())
		.then(function(result){
			if(result.Predictions.status === 200 && result.Predictions.Predictions != undefined)
			{
				$linq.Enumerable()
					.From($scope.games)
					.ForEach(function(element){
						var gameID = element.matchNum;
						var prediction = $linq.Enumerable()
							.From(result.Predictions.Predictions)
							.FirstOrDefault(null, function(prediction){
								return prediction.match_id === gameID;
							});
							
						if(prediction != null)
						{
							element.predictionHome_Score = prediction.home_score;
							element.predictionAway_Score = prediction.away_score;
						}
						else
						{
							element.predictionHome_Score = 0;
							element.predictionAway_Score = 0;
						}
						element.home_winner = false;
					});
			}
			else{
				Notification.error({message: 'Les scores des matches n\'ont pu être récupérés. Un problème technique est à l\'origine du problème.', title: 'Erreur'});
				error = true;
			}
		});
		
		if(error){
			$scope.games = [];
			return ;
		}
	}
	
	$scope.submitPronostic = function(){
		var community = $location.host() == 'localhost' ? 'test' : $location.host();
		var predictions = [];
		
		$linq.Enumerable()
			.From($scope.games)
			.ForEach(function(element){
				predictions.push(createPrediction(community, element));
		});
		
		PredictionService.savePredictions(UserService.getToken(), {
		  match_predictions_attributes: predictions
		})
		.then(function(result){
			if (result.status == 'success')
				Notification.success( result.message );
			else
				Notification.error( result.message );
		});
	}  
	
	var createPrediction = function(host, game){
		return {
			community : host, 
			email: UserService.getCurrentLogin(), 
			match_id: game.matchNum, 
			away_score: game.predictionAway_Score, 
			away_team_id: game.awayTeam,
			home_score: game.predictionHome_Score, 
			home_team_id: game.homeTeam,
			home_winner: game.home_winner
		};
	}
}
PronosticController.$inject = ['$scope','$location', 'UserService', 'PredictionService', 'GamesService', 'Notification', '$linq'];

var TestController = function($scope){
	Highcharts.chart('containerRank', {
		chart: {
			type: 'column',
			inverted: false
		},
		title: {
            text: 'Avancement de votre score',
            x: -20
        },
		xAxis: {
			categories: ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Match 5', 'Match 6', 
				'Match 7', 'Match 8', 'Match 9', 'Match 10', 'Match 11', 'Match 12']
		},
		exporting:{
			enabled: false
		},	
		credits: {
			enabled: false
		},
		series: [{
			name: 'Score',
			type:'line',
			data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
		},{
			name: 'Classement',
		type: 'column',
		data: [5,5,2,81,88,1,8,1,8,1,8,9],
		color: '#FF0000'
		}]
	});
	
	Highcharts.chart('containerStat', {
		chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
		},
		title: {
            text: 'Statistiques sur vos pronostiques',
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
		exporting:{
			enabled: false
		},	
		credits: {
			enabled: false
		},
        series: [{
            name: 'Brands',
            colorByPoint: true,
            data: [{
                name: 'Microsoft Internet Explorer',
                y: 56.33
            }, {
                name: 'Chrome',
                y: 24.03,
                sliced: true,
                selected: true
            }, {
                name: 'Firefox',
                y: 10.38
            }, {
                name: 'Safari',
                y: 4.77
            }, {
                name: 'Opera',
                y: 0.91
            }, {
                name: 'Proprietary or Undetectable',
                y: 0.2
            }]
        }]
	});
}
TestController.$inject = ['$scope'];

/**
* Angular Controller -> RanksController  
* Contains ranking data in application.
* init() * Get rankings for this community
**/
var RanksController = function($scope, $filter, $location, UserService, RankingService, Notification, $linq, NgTableParams){

	$scope.Ranks = [];
	$scope.currentUser = UserService.getCurrentLogin();
	
	$scope.init = function(){
		
		var res = RankingService.getRanks();
		res.then(function (result) {	
			if (result.Ranks.RanksData != undefined){
				$scope.Ranks = result.Ranks.RanksData;
				$scope.RanksParams = new NgTableParams({
						page: 1,            // show first page
						count: 20,           // count per page
					}, {
						total: $scope.Ranks.length, // length of data
						getData: function($defer, params) {
							
						// use build-in angular filter
						var filteredData = params.filter() ?
							$filter('filter')($scope.Ranks, params.filter()) :
								$scope.Ranks;
						var orderedData = params.sorting() ?
							$filter('orderBy')(filteredData, params.orderBy()) :
								$scope.Ranks;
						params.total(orderedData.length); // set total for recalc pagination
						$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
						}
				});
			}
			else
				Notification.error({message: result.Ranks.message, title: 'Erreur lors de la récupération du classement'});
        });
	}	
	
	$scope.classCurentUser = function(rank){
		if(rank.email == UserService.getCurrentLogin())
			return "currentUser";
		else
			return "notCurrentUser";
	}
}
RanksController.$inject = ['$scope', '$filter', '$location', 'UserService', 'RankingService', 'Notification', '$linq', 'NgTableParams'];

/**
* Angular Controller -> ForgetController  
* Forget password in application.
* forget() * Call UserService.forgetPassword() to send email
* setResponse(), setWidgetId() et cbExpiration() * Recaptcha implementation
**/
var ForgetController =   function($scope, $location, UserService, Notification){
	
	$scope.email = '';
	
	// Implementation recaptcha
	$scope.response = null;
    $scope.widgetId = null;

    $scope.model = {
        key: '6LdiSh8TAAAAADLasplj5tGB390M6qBzH24vmXED'
    };
	
	$scope.setResponse = function (response) {
        $scope.response = response;
    };

    $scope.setWidgetId = function (widgetId) {
        $scope.widgetId = widgetId;
    };
	
	$scope.cbExpiration = function() {
		vcRecaptchaService.reload($scope.widgetId);
		$scope.response = null;
    };
	
	$scope.forget = function(){
		UserService.forgetPassword($scope.email, $scope.response).then(
			function( response ){
				if (response.status == 'success') {
					Notification.success( response.message );
					$location.path('/login');
				} else {
					Notification.error( response.message );
				}
			}
		)
	}
	
	$scope.classCurrentUser = function(email) {
	// TO FINISH
		if(email === UserService.getCurrentLogin())
			return 'currentUser';
		else 
			return 'notCurrentUser';
    };
}
ForgetController.$inject = ['$scope', '$location', 'UserService', 'Notification'];

/**
* Angular Controller -> ResetPasswordController  
* Forget password in application.
* changePassword() * Change password to user connected
**/
var ResetPasswordController = function($scope, $location, $routeParams, UserService, Notification){
	
	$scope.password1 = '';
	$scope.password2 = '';
	
	$scope.changePassword = function(){
		if ($scope.password1 === $scope.password2) {
			
			UserService.changePassword($routeParams.email, $routeParams.token, $scope.password1).then(
				function( response ){
					if (response.status == 'success') {
						Notification.success( response.message );
						$location.path('/login');
					} else {
						Notification.error( response.message );
					}
				}
			)

		} else {
			Notification.error("Les mots de passe ne concordent pas");
		}
	}

}
ResetPasswordController.$inject = ['$scope', '$location', '$routeParams', 'UserService', 'Notification'];

/**
* Angular Controller -> HomeController  
* First controller
* logOut() * Log out user connected
**/
var HomeController = function($scope, $location, UserService, Notification){

	$scope.logOut = function()	{
		UserService.logout();
		$location.path('/');
		Notification.info({message: 'Vous êtes maintenant déconnecté!', title: 'Déconnexion'});
	}
	
	$scope.images = [
    	'images/background-1.jpg',
    	'images/background-2.jpg',
    	'images/background-3.jpg',
		'images/background-4.jpg',
		'images/background-5.jpg',
		'images/background-6.jpg',
		'images/background-7.jpg'
  	];
}
HomeController.$inject = ['$scope', '$location', 'UserService', 'Notification'];


var PronosticFinalController = function($scope, $location, UserService, PredictionService, GamesService, Notification, $linq){

	// JUST FOR TEST
	$scope.games = [
	{"matchNum":36,"dateTime":"2016-06-25T15:00","done":false,"group":"8èmes de finale","stadium":"Saint-Etienne","homeTeam":"2eme A","trueHomeTeam":"Suisse","trueAwayTeam":"Pologne", "awayTeam":"2eme C","homeScore":0,"awayScore":0},
	{"matchNum":37,"dateTime":"2016-06-25T18:00","done":false,"group":"8èmes de finale","stadium":"Paris","homeTeam":"1er B","trueHomeTeam":"Angleterre","trueAwayTeam":"Croatie","awayTeam":"3eme Acd","homeScore":0,"awayScore":0},
	{"matchNum":38,"dateTime":"2016-06-25T21:00","done":false,"group":"8èmes de finale","stadium":"Lens","homeTeam":"1er D","trueHomeTeam":"Espagne","trueAwayTeam":"Hongrie","awayTeam":"3eme Bef","homeScore":0,"awayScore":0},
	{"matchNum":39,"dateTime":"2016-06-26T15:00","done":false,"group":"8èmes de finale","stadium":"Lyon","homeTeam":"1er A","trueHomeTeam":"France","trueAwayTeam":"Suede","awayTeam":"3eme Cde","homeScore":0,"awayScore":0},
	{"matchNum":40,"dateTime":"2016-06-26T18:00","done":false,"group":"8èmes de finale","stadium":"Lille","homeTeam":"1er C","trueHomeTeam":"Allemagne","trueAwayTeam":"Slovaquie","awayTeam":"3eme Abf","homeScore":0,"awayScore":0},
	{"matchNum":41,"dateTime":"2016-06-26T21:00","done":false,"group":"8èmes de finale","stadium":"Toulouse","homeTeam":"1er F","trueHomeTeam":"Portugal","trueAwayTeam":"Italie","awayTeam":"2eme E","homeScore":0,"awayScore":0},
	{"matchNum":42,"dateTime":"2016-06-27T18:00","done":false,"group":"8èmes de finale","stadium":"Saint-Denis","homeTeam":"1er E","trueHomeTeam":"Belgique","trueAwayTeam":"Rep. Tcheque","awayTeam":"2eme D","homeScore":0,"awayScore":0},
	{"matchNum":43,"dateTime":"2016-06-27T21:00","done":false,"group":"8èmes de finale","stadium":"Nice","homeTeam":"2eme B","trueHomeTeam":"Russie","trueAwayTeam":"Autriche","awayTeam":"2eme F","homeScore":0,"awayScore":0},
	{"matchNum":44,"dateTime":"2016-06-30T21:00","done":false,"group":"Quarts de finale","stadium":"Marseille","homeTeam":"2eme A Ou 2eme C","awayTeam":"1er D Ou 3eme Bef","homeScore":0,"awayScore":0},
	{"matchNum":45,"dateTime":"2016-07-01T21:00","done":false,"group":"Quarts de finale","stadium":"Lille","homeTeam":"1er B Ou 3eme Acd","awayTeam":"1er F Ou 2eme E","homeScore":0,"awayScore":0},
	{"matchNum":46,"dateTime":"2016-07-02T21:00","done":false,"group":"Quarts de finale","stadium":"Bordeaux","homeTeam":"1er C Ou 3eme Abf","awayTeam":"1er E Ou 2eme D","homeScore":0,"awayScore":0},
	{"matchNum":47,"dateTime":"2016-07-03T21:00","done":false,"group":"Quarts de finale","stadium":"Saint-Denis","homeTeam":"1er A Ou 3eme Cde","awayTeam":"2eme B Ou 2eme F","homeScore":0,"awayScore":0},
	{"matchNum":48,"dateTime":"2016-07-06T21:00","done":false,"group":"Demi-finales","stadium":"Lyon","homeTeam":"Vq1","awayTeam":"Vq2","homeScore":0,"awayScore":0},
	{"matchNum":49,"dateTime":"2016-07-07T21:00","done":false,"group":"Demi-finales","stadium":"Marseille","homeTeam":"Vq3","awayTeam":"Vq4","homeScore":0,"awayScore":0},
	{"matchNum":50,"dateTime":"2016-07-10T21:00","done":false,"group":"Finale","stadium":"Saint-Denis","homeTeam":"","awayTeam":"","homeScore":0,"awayScore":0}
	];
	
	$scope.tabs = [
		{ title:'8èmes de finale', content:'<div class="item active"><h3 class="group-name">8èmes de finale</h3><hr/><pronostic-final ng-repeat="match in games | filter:{group:\'8èmes de finale\'}:true" match="match"></pronostic-final></div>'},
		{ title:'Quarts de finale', content:'<div class="item"><h3 class="group-name">Quarts de finale</h3><hr/><pronostic-final ng-repeat="match in games | filter:{group:\'Quarts de finale\'}:true" match="match"></pronostic-final></div>'},
		{ title:'Demi-finales', content:'<div class="item"><h3 class="group-name">Demi-finales</h3><hr/><pronostic-final ng-repeat="match in games | filter:{group:\'Demi-finales\'}:true" match="match"></pronostic-final></div>'},
		{ title:'Finale', content:'<div class="item"><h3 class="group-name">Finale</h3><hr/><pronostic-final ng-repeat="match in games | filter:{group:\'Finale\'}:true" match="match"></pronostic-final></div>'}];
		
	$scope.init = function(){}	
	$scope.submitPronostic = function(){} 

			
	$scope.watchMatch= function(match){
		// TODO : implémenter avec le bool homeWinner
		if(match.group === '8èmes de finale')
		{
			var matchQuart = $linq.Enumerable()
									.From($scope.games)
									.Where(function(m){
										return m.homeTeam === match.homeTeam + ' Ou ' + match.awayTeam || 
										m.awayTeam === match.homeTeam + ' Ou ' + match.awayTeam;
									}).First();
			
			var winnerTeam = $scope.winnerMatch(match);
			if(winnerTeam != false)
			{
				if(matchQuart.homeTeam === match.homeTeam + ' Ou ' + match.awayTeam)
					matchQuart.trueHomeTeam = winnerTeam;
				else
					matchQuart.trueAwayTeam = winnerTeam;
			}
			// TODO : Faire la récursivité pour  les quarts
		}
		else if(match.group == 'Quarts de finale')
		{
			var indexDemie, matchDemie;
			indexDemie = $linq.Enumerable()
							.From($scope.games)
							.Where(function(m){
								return m.group == 'Quarts de finale';
							})
							.OrderBy(function(m){
								return m.matchNum;
							})
							.Select(function(m){
								return m.matchNum;
							})
							.IndexOf(match.matchNum) + 1;				
			if(indexDemie != -1)
			{
				matchDemie = $linq.Enumerable()
							.From($scope.games)
							.Where(function(m){
								return m.homeTeam === 'Vq'+indexDemie || 
										m.awayTeam === 'Vq'+indexDemie;
							}).First();			
				var winnerTeam = $scope.winnerMatch(match);
				if(winnerTeam != false)
				{
					if(matchDemie.homeTeam === 'Vq'+indexDemie)
						matchDemie.trueHomeTeam = winnerTeam;
					else
						matchDemie.trueAwayTeam = winnerTeam;
				}
			}
			// TODO : Faire la récursivité pour  les demies
		}
		// TODO : Faire demies-finale + Récursivités finale
	}
	
	
	$scope.winnerMatch = function(match){
		// TODO : implémenter avec le bool homeWinner
		if(match.predictionHome_Score != undefined && match.predictionAway_Score != undefined)
			return match.predictionHome_Score > match.predictionAway_Score ? match.trueHomeTeam : match.trueAwayTeam;
		else
			return false;
	}
	
}
PronosticFinalController.$inject = ['$scope','$location', 'UserService', 'PredictionService', 'GamesService', 'Notification', '$linq'];