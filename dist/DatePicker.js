(function(angular) {
	var module = angular.module('net.enzey.datepicker', ['ngAnimate']);
	var selectedMonthPrefix = 'selectedMonth';

	module.filter('nzMonthName', ['$locale', function ($locale) {
		return function (key, p) {
			return $locale.DATETIME_FORMATS.MONTH[key];
		}
	}]);

	module.directive('nzDatePicker', ['$parse', '$timeout', '$locale', '$animate', function($parse, $timeout, $locale, $animate) {
		return {
			scope: {},
			restrict: 'AE',
			template: function(element, attr) {
				var headers = '';
				var shortDayNames = $locale.DATETIME_FORMATS.SHORTDAY;
				shortDayNames.forEach(function(shortName) {
					headers += '<div>' + shortName + '</div>';
				});

				var months = '';
				var shortMonthNames = $locale.DATETIME_FORMATS.SHORTMONTH;
				for (var i = 0; i < shortMonthNames.length; i++) {
					months += '<li month="' + (i+1) + '">' + shortMonthNames[i] + '</li>';
				};

				var yearWeeks = '';
				for (var i = 0; i < 53; i++) {
					yearWeeks += '<li></li>';
				};
				
				return '\
						<div class="currentMonthYear">\
							<span class="month">{{currentMonth-1 | nzMonthName}}</span>\
							<span class="year">{{currentYear}}</span>\
						</div>\
						<div>\
							<table>\
								<tr>\
									<th></th>\
									<th class="header">' + headers + '</th>\
								</tr>\
								<tr>\
									<td class="positionViewport">\
										<ul class="weekPosition">' + yearWeeks + '</ul>\
										<ul class="monthScroller">' + months + '</ul>\
									</td>\
									<td>\
										<div class="picker">\
											<div ng-repeat="week in weeks" nz-week-template="week" class="nzDatePickerRow" ng-animate="\'nzDatePickerRow\'">\
											</div>\
										</div>\
									</td>\
									<td>\
										<ul class="controls">\
											<li class="prevYear"  ng-click="renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevMonth();renderPrevWeek();updateCenteredMonth();"></li>\
											<li class="prevMonth" ng-click="renderPrevMonth();renderPrevWeek();updateCenteredMonth();"></li>\
											<li class="prevWeek"  ng-click="renderPrevWeek();updateCenteredMonth();"></li>\
											<li class="nextWeek"  ng-click="renderNextWeek();updateCenteredMonth();"></li>\
											<li class="nextMonth" ng-click="renderNextMonth();renderNextWeek();updateCenteredMonth();"></li>\
											<li class="nextYear"  ng-click="gotoNextYear()"></li>\
										</ul>\
									</td>\
								</tr>\
							</table>\
						</div>\
						';
			},
			controller: ['$scope', function ($scope) {
				var dayInMS = 24 * 60 * 60 * 1000;
				var weekInMS = 7 * dayInMS;
				// Taking into account leap years.
				var trueYearInMS = 365.242199 * dayInMS;
				var createDayObj = function(date) {
					return {
						date: date
					};
				};
				$scope.getWeek = function (date) {
				var onejan = new Date(date.getUTCFullYear(),0,1);
				// First day of the calender
				var dayOffset = 0;
				return Math.ceil((((date - onejan) / 86400000) + onejan.getUTCDay() + dayOffset)/7);
				};
				var toNumber = function(n) {
					n = +n;
					if (!n) {
						n = 1;
					}
					return n;
				};
				$scope.removeTimeFromDate = function(date) {
					var time = date.getTime();
					return new Date(time - (time % dayInMS));
				};
				$scope.addDay = function(date, n) {
					return new Date(date.getTime() + (dayInMS * toNumber(n)));
				};
				$scope.addWeek = function(date, n) {
					return new Date(date.getTime() + (weekInMS * toNumber(n)));
				};

				$scope.getBeginningOfWeek = function(date) {
					return new Date( date.getTime() - (dayInMS * date.getUTCDay()) );
				};
				$scope.generateWeek = function(startDate) {
					startDate = $scope.getBeginningOfWeek(startDate);
					var week = [];
					for (var i = 0; i < 7; i++) {
						week.push( createDayObj(startDate) );
						startDate = $scope.addDay(startDate);
					}

					return week;
				};
				$scope.generatePrevMonth = function(startDate) {
					var weeks = [];
					startDate = $scope.getBeginningOfWeek(startDate);
					startDate = $scope.addDay(startDate, -1);
					var startMonth = startDate.getUTCMonth();
					var week;
					while ( (week = $scope.generateWeek(startDate))[6].date.getUTCMonth() === startMonth) {
						weeks.push(week);
						startDate = $scope.addDay(week[0].date, -1);
					}
					return weeks;
				};
				$scope.generateNextMonth = function(startDate) {
					var weeks = [];
					startDate = $scope.getBeginningOfWeek(startDate);
					startDate = $scope.addDay(startDate, 7);
					var startMonth = startDate.getUTCMonth();
					var week;
					while ( (week = $scope.generateWeek(startDate))[0].date.getUTCMonth() === startMonth) {
						weeks.push(week);
						startDate = $scope.addDay(week[6].date, 1);
					}
					return weeks;
				};
				$scope.firstRenderedDay = function() {
					return $scope.weeks[0][0];
				};
				$scope.lastRenderedDay = function() {
					return $scope.weeks[ $scope.weeks.length-1 ][6];
				};
				$scope.renderPrevMonth = function(skipRemoval) {
					var weeks = $scope.generatePrevMonth($scope.firstRenderedDay().date);
					weeks.forEach(function(week) {
						var firstWeek = $scope.weeks[0];
						week.isStripped = !firstWeek.isStripped;
						$scope.weeks.unshift(week)
						if (!skipRemoval) {
							$scope.weeks.pop();
						}
					});
				};
				$scope.renderNextMonth = function(skipRemoval) {
					var weeks = $scope.generateNextMonth($scope.lastRenderedDay().date);
					weeks.forEach(function(week) {
						var lastWeek = $scope.weeks[$scope.weeks.length-1];
						week.isStripped = !lastWeek.isStripped;
						$scope.weeks.push(week)
						if (!skipRemoval) {
							$scope.weeks.shift();
						}
					});
				};
				$scope.renderPrevWeek = function(skipRemoval) {
					var week = $scope.generateWeek( $scope.addDay($scope.firstRenderedDay().date, -1));
					var lastWeek = $scope.weeks[0];
					week.isStripped = !lastWeek.isStripped;
					$scope.weeks.unshift(week);
					if (!skipRemoval) {
						$scope.weeks.pop();
					}
				};
				$scope.renderNextWeek = function(skipRemoval) {
					var week = $scope.generateWeek( $scope.addDay($scope.lastRenderedDay().date, 1));
					var lastWeek = $scope.weeks[$scope.weeks.length-1];
					week.isStripped = !lastWeek.isStripped;
					$scope.weeks.push(week);
					if (!skipRemoval) {
						$scope.weeks.shift();
					}
				};

			}],
			compile: function ($element, $attrs) {
				$element.addClass('nzDatePicker');

				return {
					pre: function(scope, element, attrs) {
						scope.ngModel = attrs.ngModel;
						var selection = $parse(attrs.ngModel)(scope.$parent);
						if (!selection) {
							selection = new Date();
						}
						selection = scope.removeTimeFromDate(selection);

						scope.gotoNextYear = function() {
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextMonth();
							scope.renderNextWeek();
							scope.updateCenteredMonth();
						};
						scope.$parent.$watch(attrs.ngModel, function(newVal, oldVal) {
							if (newVal && oldVal) {
								var timelessDate = scope.removeTimeFromDate(newVal);
								if (timelessDate.getTime() !== oldVal.getTime()) {
									$parse(attrs.ngModel).assign(scope.$parent, timelessDate);
								}
							}
						});

						scope.setDate = function(date, $event) {
							angular.element(element[0].querySelectorAll('.day')).removeClass('selected');
							angular.element($event.currentTarget).addClass('selected');
							$parse(scope.ngModel).assign(scope.$parent, date);
						};

						scope.selectMonth = function(monthIndex) {
							for (var i = 1; i < 13; i++) {
								element.removeClass(selectedMonthPrefix + i);
							}
							element.addClass(selectedMonthPrefix + monthIndex);
							element.addClass(selectedMonthPrefix + monthIndex);
							scope.currentMonth = monthIndex;
						};

						scope.updateCenteredMonth = function() {
							var centerWeek = Math.floor(scope.weeks.length / 2);
							var selectedMonth = scope.weeks[centerWeek][0].date.getUTCMonth() + 1;
							if (selectedMonth > 12) {selectedMonth = 1;}
							if (selectedMonth < 1) {selectedMonth = 12;}
							scope.selectMonth(selectedMonth);
							scope.currentYear = scope.weeks[3][0].date.getUTCFullYear();
						};

						angular.element(element[0].querySelector('.picker')).on('DOMMouseScroll mousewheel', function (event) {
							event.preventDefault();
							var movement = event.wheelDelta;
							if (!movement) {
								movement = 0-event.detail;
							}
							if (movement < 0) {
								scope.renderNextWeek();
							} else {
								scope.renderPrevWeek();
							}

							scope.updateCenteredMonth();
							scope.$apply();
						});

						var firstOfWeek = scope.getBeginningOfWeek(selection);
						scope.weeks = [];
						var thisWeek = scope.generateWeek(firstOfWeek);
						scope.weeks.push( thisWeek );
						scope.renderNextWeek(true);
						scope.renderNextWeek(true);
						scope.renderNextWeek(true);
						scope.renderPrevWeek(true);
						scope.renderPrevWeek(true);
						scope.renderPrevWeek(true);

						scope.updateCenteredMonth();
					},
					post: function (scope, element, attrs) {
						scope.currentYear = scope.weeks[3][0].date.getUTCFullYear();
						scope.$watchCollection('weeks', function(newArray) {
							var weeksOfYear = angular.element(element[0].querySelector('.weekPosition')).children();
							weeksOfYear.removeClass('viewingWeek');
							if (newArray) {
								newArray.forEach(function(weekModel) {
									var day = weekModel[0];
									var weekOfYear = scope.getWeek(day.date)-1;
									angular.element(weeksOfYear[weekOfYear]).addClass('viewingWeek');
									if (weekOfYear === 52) {
										angular.element(weeksOfYear[0]).addClass('viewingWeek');
									}
								});
							}
						});
					}
				};
			}
		};
	}]);

	module.directive('nzWeekTemplate', ['$parse', '$compile', function($parse, $compile) {
		return {
			restrict: 'AE',
			compile: function ($element, $attrs) {
				var directiveName = this.name;

				return {
					pre: function(scope, element, attrs) {
						var weekModel = $parse(attrs[directiveName])(scope);
						var selectedDate = $parse(scope.ngModel)(scope.$parent.$parent);

						if (weekModel.isStripped) {
							element.addClass('stripe');
						}

						weekModel.forEach(function(day) {
							var dayScope = scope.$new();
							dayScope = angular.extend(dayScope, day);
							var month = day.date.getUTCMonth() + 1;
							var dayElem = $compile('<div class="day" ng-click="setDate(date, $event)" month="' + month + '"><span>' + day.date.getUTCDate() + '</span></div>')(dayScope);
							if (selectedDate && selectedDate.getTime() === day.date.getTime()) {
								dayElem.addClass('selected');
							}
							element.append( dayElem );
						});
					},
					post: function (scope, element, attrs) {
						
					}
				};
			}
		};
	}]);


})(angular);