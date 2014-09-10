(function(angular) {
	var module = angular.module('net.enzey.datepicker', ['ngAnimate']);
	var selectedMonthPrefix = 'selectedMonth';

	module.filter('nzMonthName', function ($locale) {
		return function (key, p) {
			return $locale.DATETIME_FORMATS.MONTH[key];
		}
	});

	module.directive('nzDatePicker', function($parse, $timeout, $locale, $animate) {
		return {
			scope: {},
			restrict: 'AE',
			template: function(element, attr) {
				var headers = '';
				var shortDayNames = $locale.DATETIME_FORMATS.SHORTDAY;
				shortDayNames.forEach(function(shortName) {
					headers += '<span>' + shortName + '</span>';
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
						<div>\
							<div class="month">{{currentMonth-1 | nzMonthName}}</div>\
							<div class="year">{{currentYear}}</div>\
						</div>\
						<div>\
							<table>\
								<tr>\
									<th></th>\
									<th class="header">' + headers + '</th>\
								</tr>\
								<tr>\
									<td>\
										<ul class="weekPosition">' + yearWeeks + '</ul>\
										<ul class="monthScroller">' + months + '</ul>\
									</td>\
									<td>\
										<ul class="picker">\
											<li ng-repeat="week in weeks" nz-week-template="week" class="nzDatePickerRow" ng-animate="\'nzDatePickerRow\'">\
											</li>\
										</ul>\
									</td>\
								</tr>\
							</table>\
						</div>\
						';
			},
			controller: function ($scope) {
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
				var onejan = new Date(date.getFullYear(),0,1);
				// First day of the calender
				var dayOffset = 0;
				return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + dayOffset)/7);
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
					return new Date(time - (time % dayInMS) + 1);
				};
				$scope.addDay = function(date, n) {
					return new Date(date.getTime() + (dayInMS * toNumber(n)));
				};
				$scope.addWeek = function(date, n) {
					return new Date(date.getTime() + (weekInMS * toNumber(n)));
				};

				$scope.getBeginningOfWeek = function(date) {
					return new Date( date.getTime() - (dayInMS * date.getDay()) );
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
					var startMonth = startDate.getMonth();
					var week;
					while ( (week = $scope.generateWeek(startDate))[6].date.getMonth() === startMonth) {
						weeks.push(week);
						startDate = $scope.addDay(week[0].date, -1);
					}
					return weeks;
				};
				$scope.generateNextMonth = function(startDate) {
					var weeks = [];
					startDate = $scope.getBeginningOfWeek(startDate);
					startDate = $scope.addDay(startDate, 7);
					var startMonth = startDate.getMonth();
					var week;
					while ( (week = $scope.generateWeek(startDate))[0].date.getMonth() === startMonth) {
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
				$scope.renderPrevMonth = function() {
					var weeks = $scope.generatePrevMonth($scope.firstRenderedDay().date);
					weeks.forEach(function(week) {
						var firstWeek = $scope.weeks[0];
						week.isStripped = !firstWeek.isStripped;
						$scope.weeks.unshift(week)
					});
				};
				$scope.renderNextMonth = function() {
					var weeks = $scope.generateNextMonth($scope.lastRenderedDay().date);
					weeks.forEach(function(week) {
						var lastWeek = $scope.weeks[$scope.weeks.length-1];
						week.isStripped = !lastWeek.isStripped;
						$scope.weeks.push(week)
					});;
				};
				$scope.renderPrevWeek = function() {
					var week = $scope.generateWeek( $scope.addDay($scope.firstRenderedDay().date, -1));
					var lastWeek = $scope.weeks[0];
					week.isStripped = !lastWeek.isStripped;
					$scope.weeks.unshift(week);
				};
				$scope.renderNextWeek = function() {
					var week = $scope.generateWeek( $scope.addDay($scope.lastRenderedDay().date, 1));
					var lastWeek = $scope.weeks[$scope.weeks.length-1];
					week.isStripped = !lastWeek.isStripped;
					$scope.weeks.push(week);
				};
			},
			compile: function ($element, $attrs) {
				$element.addClass('nzDatePicker');

				return {
					pre: function(scope, element, attrs) {
						scope.ngModel = attrs.ngModel;
						var selection = $parse(attrs.ngModel)(scope);
						if (!selection) {
							selection = new Date();
						}
						selection = scope.removeTimeFromDate(selection);

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
							scope.currentMonth = monthIndex;
						};

						angular.element(element[0].querySelector('.picker')).on('DOMMouseScroll mousewheel', function (event) {
							event.preventDefault();
							var movement = event.wheelDelta;
							if (!movement) {
								movement = 0-event.detail;
							}
							if (movement < 0) {
								scope.renderNextWeek();
								scope.weeks.shift();
							} else {
								scope.renderPrevWeek();
								scope.weeks.pop();
							}
							console.log(scope.weeks.length);
							var centerWeek = Math.floor(scope.weeks.length / 2);
							var selectedMonth = scope.weeks[centerWeek][0].date.getMonth() + 1;
							if (selectedMonth > 12) {selectedMonth = 1;}
							if (selectedMonth < 1) {selectedMonth = 12;}
							scope.selectMonth(selectedMonth);
							scope.currentYear = scope.weeks[3][0].date.getFullYear();
							scope.$apply();
						});

						var firstOfWeek = scope.getBeginningOfWeek(selection);
						scope.weeks = [];
						var thisWeek = scope.generateWeek(firstOfWeek);
						scope.weeks.push( thisWeek );
						scope.renderPrevMonth();
						scope.renderNextMonth();
						scope.renderNextWeek();
						scope.renderPrevWeek();
						if (scope.weeks[0][0].date.getMonth() === scope.weeks[0][6].date.getMonth()) {
							scope.weeks.unshift();
						}
						if (scope.weeks[scope.weeks.length-1][0].date.getMonth() === scope.weeks[scope.weeks.length-1][6].date.getMonth()) {
							scope.weeks.pop();
						}

						scope.selectMonth(firstOfWeek.getMonth()+1);
					},
					post: function (scope, element, attrs) {
						scope.currentYear = scope.weeks[3][0].date.getFullYear();
						$timeout(function() {
							var monthSelection = angular.element(element[0].querySelector('.monthScroller'));
							var picker = angular.element(element[0].querySelector('.picker'));
							monthSelection.css('height', picker[0].clientHeight);
							picker.css('height', picker[0].clientHeight);
						}, 0, false);
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
	});

	module.directive('nzWeekTemplate', function($parse, $compile) {
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
							var month = day.date.getMonth() + 1;
							var dayElem = $compile('<div class="day" ng-click="setDate(date, $event)" month="' + month + '"><span>' + day.date.getDate() + '</span></div>')(dayScope);
							if (selectedDate && selectedDate.getTime() === day.date.getTime()) {
								dayElem.addClass('selected');
							}
							element.append( dayElem );
						});
						if (scope.getWeek(weekModel[0].date) !== scope.getWeek(weekModel[6].date)) {
						console.log( 'First: ' + scope.getWeek(weekModel[0].date) + ' Last: ' + scope.getWeek(weekModel[6].date));
						}
					},
					post: function (scope, element, attrs) {
						
					}
				};
			}
		};
	});


})(angular);