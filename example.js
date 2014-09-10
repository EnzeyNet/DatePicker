(function(angular) {

	var module = angular.module('net.enzey.examples',
		[
			'ngAnimate',
			'net.enzey.datepicker'
		]
	);

	module.controller('datePickerExample', function($scope, $timeout, $rootScope, $q) {
		$scope.selectedDate = new Date();
		var getWatchCount = function (scope, scopeHash) {
			// default for scopeHash
			if (scopeHash === undefined) {
				scopeHash = {};
			}

			// make sure scope is defined and we haven't already processed this scope
			if (!scope || scopeHash[scope.$id] !== undefined) {
				return 0;
			}

			var watchCount = 0;

			if (scope.$$watchers) {
				watchCount = scope.$$watchers.length;
			}
			scopeHash[scope.$id] = watchCount;

			// get the counts of children and sibling scopes
			// we only need childHead and nextSibling (not childTail or prevSibling)
			watchCount+= getWatchCount(scope.$$childHead, scopeHash);
			watchCount+= getWatchCount(scope.$$nextSibling, scopeHash);

			return watchCount;
		};
		var updateWatchCount;
		updateWatchCount = function() {
			$timeout(function() {
				$scope.watchCount = getWatchCount($rootScope);
				updateWatchCount();
			}, 3000, true);
		};
		updateWatchCount();

	});

})(angular);