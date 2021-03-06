/**
* Angular Directive -> logoCEDisplay
* Attribute Directive for display logo CE if host is grand-est
**/
var logoCeDisplay = function ($location) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
		
		
            var showIfGE = function() {
                if($location.host() == 'grand-est.pronostics2016.com'){
                    $(element).show();
                } else {
                    $(element).hide();
                }
            };
            showIfGE();
        }
    };
}
logoCeDisplay.$inject = ['$location'];

/**
* Angular Directive -> pronostic
* Element Directive for display a match
**/
var pronostic = function(){
	return {
		restrict: 'E',
		templateUrl: '/partials-views/pronostic.html',
		scope: {
			match: "=",
			access: "="
		},
		controller: function($scope, $location) {
									
			$scope.isPronosticable = function(match){
				// return (match.dateTime <= new Date() && !match.done);
				// FIXME
				return false;
			}
			
			$scope.realScore = function(predictionScore, realScore){
				return predictionScore == realScore ? "realScoreGood" : "realScoreBad";
			}
			
			$scope.$watch('match.predictionHome_Score', function( newValue, oldValue ){
				
			   if(newValue == "" || newValue == undefined)
				   $scope.match.predictionHome_Score = 0;
			   else
				   $scope.match.predictionHome_Score = parseInt(newValue);
			  }, true);
			  
			$scope.$watch('match.predictionAway_Score', function( newValue, oldValue ){
			   if(newValue == "" || newValue == undefined)
				   $scope.match.predictionAway_Score = 0;
			   else
				   $scope.match.predictionAway_Score = parseInt(newValue);
			  }, true);
			
			$scope.classFlagTeam = function(nameTeam) {
				var linking = {
					"France" : "FRA",
					"Allemagne" : "GER",
					"Albanie" : "ALB",
					"Autriche" : "AUT",
					"Belgique" : "BEL", 
					"Roumanie" : "ROU",
					"Suisse" : "SUI", 
					"Angleterre" : "ENG", 
					"Russie" : "RUS", 
					"Slovaquie" : "SVK",
					"Galles" : "WAL",
					"Irlande Du Nord" : "NIR", 
					"Pologne" : "POL", 
					"Ukraine" : "UKR",
					"Croatie" :  "CRO",
					"Rep. Tcheque"  : "CZE",
					"Espagne" : "ESP",
					"Turquie" : "TUR",
					"Italie" : "ITA", 
					"Irlande" : "IRL", 
					"Suede" : "SWE", 
					"Hongrie" : "HUN", 
					"Islande" : "ISL",
					"Portugal" : "POR"
				}
				return "flag-"+linking[nameTeam];
			};
        }
    };
}

/**
* Angular Directive -> pronostic
* Attribute Directive for compile tab content in pronostic view
**/
var compileHtml = function($sce, $parse, $compile) {
    return {
      restrict: 'A',
      compile: function ngBindHtmlCompile(tElement, tAttrs) {
        var ngBindHtmlGetter = $parse(tAttrs.compileHtml);
        var ngBindHtmlWatch = $parse(tAttrs.compileHtml, function getStringValue(value) {
          return (value || '').toString();
        });
        $compile.$$addBindingClass(tElement);

        return function ngBindHtmlLink(scope, element, attr) {
          $compile.$$addBindingInfo(element, attr.compileHtml);

          scope.$watch(ngBindHtmlWatch, function ngBindHtmlWatchAction() {

            element.html($sce.trustAsHtml(ngBindHtmlGetter(scope)) || '');
            $compile(element.contents())(scope);
          });
        };
      }
    };
 }
compileHtml.$inject = ['$sce', '$parse', '$compile'];


/**
* Angular Directive -> pronosticFinal
* Element Directive for display a final match
**/
var pronosticFinal = function(){
	return {
		restrict: 'E',
		templateUrl: '/partials-views/pronosticFinal.html',
		scope: {
			match: "=match",
			access: "=access"
		},
		controller: function($scope, $location) {
			
			$scope.matchNul = function(){
				return $scope.match.predictionHome_Score != undefined && $scope.match.predictionAway_Score != undefined &&
					$scope.match.predictionHome_Score == $scope.match.predictionAway_Score;
			}
			
			$scope.isPronosticable = function(){
				return $location.path() == '/pronostic-final-delegate' || ($scope.access == 'W' && !$scope.match.done ); //FIXME : && $scope.match.dateTime <= new Date());
			}

			$scope.displayFinalScore = function() {
				return $location.path() != '/pronostic-final-delegate' && $scope.match.done;
			}
			
			$scope.realScore = function(predictionScore, realScore){
				return predictionScore == realScore ? "realScoreGood" : "realScoreBad";
			}
			
			$scope.$watch('match.home_winner', function( newValue, oldValue ){
				if(newValue != undefined){
					$scope.$parent.watchMatch($scope.match);
				}
			  }, true);
			
			$scope.$watch('match.predictionHome_Score', function( newValue, oldValue ){
				if(newValue != undefined)
				{
				   if(newValue == "")
						$scope.match.predictionHome_Score = 0;
				   else{
						$scope.match.predictionHome_Score = parseInt(newValue);
						if($scope.match.predictionHome_Score > $scope.match.predictionAway_Score)
							$scope.match.home_winner  = true;
				   }
					$scope.$parent.watchMatch($scope.match);
				}
			  }, true);
			  
			$scope.$watch('match.predictionAway_Score', function( newValue, oldValue ){
				if(newValue != undefined)
				{
				   if(newValue == "")
					   $scope.match.predictionAway_Score = 0;
				   else{
					   $scope.match.predictionAway_Score = parseInt(newValue);
					   if($scope.match.predictionHome_Score < $scope.match.predictionAway_Score)
							$scope.match.home_winner  = false;
				   }
					$scope.$parent.watchMatch($scope.match);
				}
			  }, true);
			
			$scope.classFlagTeam = function(nameTeam) {
				var linking = {
					"France" : "FRA",
					"Allemagne" : "GER",
					"Albanie" : "ALB",
					"Autriche" : "AUT",
					"Belgique" : "BEL", 
					"Roumanie" : "ROU",
					"Suisse" : "SUI", 
					"Angleterre" : "ENG", 
					"Russie" : "RUS", 
					"Slovaquie" : "SVK",
					"Galles" : "WAL",
					"Irlande Du Nord" : "NIR", 
					"Pologne" : "POL", 
					"Ukraine" : "UKR",
					"Croatie" :  "CRO",
					"Rep. Tcheque"  : "CZE",
					"Espagne" : "ESP",
					"Turquie" : "TUR",
					"Italie" : "ITA", 
					"Irlande" : "IRL", 
					"Suede" : "SWE", 
					"Hongrie" : "HUN", 
					"Islande" : "ISL",
					"Portugal" : "POR"
				}
				return nameTeam != undefined ? "flag-"+linking[nameTeam] : "flag-";
			};
        }
    };
}


/**
* Angular Directive -> pronosticFinal
* Element Directive for display a final match
**/
var backButton = function(){
    return {
      restrict: 'A',

      link: function(scope, element, attrs) {
        element.bind('click', goBack);

        function goBack() {
			window.history.back();
			//history.back();
			scope.$apply();
        }
      }
    }
};	