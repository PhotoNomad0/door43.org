
/**
 * Return a formatted string.
 * Replaces {0}, {1} ... {n} with the corresponding elements of the args array.
 * @param {String} format The format string
 * @param {String[]} args The list of replacements
 * @returns {String}
 */
function simpleFormat(format, args) {
  return format.replace(/{(\d+)}/g, function (match, index) {
    return (typeof args[index] !== 'undefined') ? args[index] : match;
  });
}

/**
 * Search for the selected term or phrase
 * @param {String} search_term The term or phrase to search for
 */
function searchForResources(search_term) {

  var url = '/temp-data.json';

  $.ajax({
    url: url,
    dataType: 'json',
    data: {
      q: search_term,
      format: 'json'
    }
  })
    .done(function (response) {
      showSearchResults(response);
    })
    .fail(function (data, status, error) {
      console.log(error);
      console.log(data);
    });
}

/**
 * Displays the results returned by the search
 * @param {Object} results
 */
function showSearchResults(results) {

  // validate the results
  if (!results.hasOwnProperty('popular')) {
    console.log('Returned object does not contain "popular."');
    console.log(results);
    return;
  }

  if (!results.hasOwnProperty('recent')) {
    console.log('Returned object does not contain "recent."');
    console.log(results);
    return;
  }

  // load the template
  var template = $('#listing-template').html();

  // sort popular and recent
  var popular = _.sortBy(results['popular'], 'num_views').reverse();
  var recent = _.sortBy(results['recent'], 'last_updated').reverse();

  // display popular
  var $div = $('#popular-div').find('.search-listing');
  var i, len;
  for (i = 0, len = popular.length; i < len; i++) {
    showThisItem(popular[i], $div, template);
  }
  showMoreLink($div);

  // display popular
  $div = $('#recent-div').find('.search-listing');
  for (i = 0, len = recent.length; i < len; i++) {
    showThisItem(recent[i], $div, template);
  }
  showMoreLink($div);
}

/**
 * Appends item to the specified div
 * @param {Object} item
 * @param {Object} $div A jquery object
 * @param {String} template The HTML template for the new item
 */
function showThisItem(item, $div, template) {

  var $template = $(template);
  var today = moment.utc().startOf('day');

  $template.find('.title-span').html(item['resource_name']);
  $template.find('.author-div').html(simpleFormat(l10n['author'], [item['author']]));
  $template.find('.language-title-span').html(l10n['language']);
  $template.find('.language-code-div').html(simpleFormat(l10n['language_with_code'], [item['lang_name'], item['lang_code']]));
  $template.find('.views-span').html(item['num_views']);
  $template.find('.updated-span').html(getDateDiff(item['last_updated'], today));

  // TODO: set anchor href to the correct value
  $template.find('a').attr('href', 'put_the_url_here');

  $div.append($template);
}

/**
 *
 * @param published_date
 * @param {Object} today A moment object representing today
 * @returns {string}
 */
function getDateDiff(published_date, today) {

  // calculate the difference in days
  var published = moment(published_date);
  var days = today.diff(published, 'days');

  if (days < 1)
    return l10n['updated_today'];

  var idx;

  if (days < 7) {
    idx = (days > l10n['day'].length - 1 ? l10n['day'].length - 1 : days);
    return simpleFormat(l10n['updated_days'], [days, l10n['day'][idx]]);
  }

  // calculate the difference in weeks
  var weeks = today.diff(published, 'weeks');

  if (weeks < 5) {
    idx = (weeks > l10n['week'].length - 1 ? l10n['week'].length - 1 : weeks);
    return simpleFormat(l10n['updated_weeks'], [weeks, l10n['week'][idx]]);
  }

  // calculate the difference in months
  var months = today.diff(published, 'months');
  idx = (months > l10n['month'].length - 1 ? l10n['month'].length - 1 : months);
  return simpleFormat(l10n['updated_months'], [months, l10n['month'][idx]]);
}

function showMoreLink($div) {

  var $template = $($('#more-template').html());

  // TODO: set anchor href to the correct value
  $template.find('a').attr('href', 'put_the_url_here');

  $div.append($template);
}

function scrollToResults(scroll_to_id) {

  var item_top = $('#' + scroll_to_id).offset().top;
  window.scrollTo(0, item_top - 130);

  // prevent default
  return false;
}

/**************************** language selector ****************************/
var languageSelectorTimer;

/**
 * Initialize the language selector
 */
function setupLanguageSelector() {

  var $searchFor = $('body').find('#search-for');

  $searchFor.on('keyup', function(event) {
    languageSelectorKeyUp(event);
  });

  $searchFor.on('autocompleteclose', function() {

    var langText = jQuery(this).val();
    if (!langText) return;

    // if closed without picking from the list, do nothing
    if (langText.indexOf(')') < 3) return;

    var langCodes = langText.match(/\(([a-z0-9-]+)\)$/i);

    if ((!langCodes) || (langCodes.length !== 2)) return;

    // TODO: Replace 'alert' with code to handle selection of a language
    alert('Selected language code "' + langCodes[1] + '"');
  });
}

/**
 *
 * @param event
 */
function languageSelectorKeyUp(event) {

  // the Enter key press must be handled by the plugin
  if (event.which === 13) return;

  // if the timer is currently running, reset it
  if (languageSelectorTimer) {
    clearTimeout(languageSelectorTimer);
  }

  var $textBox = $(event.target);
  var textVal = $textBox.val();
  var lastSearch = $textBox.attr('data-last-search');

  // should we clear the list to avoid showing the wrong list?
  if (lastSearch) {
    if (textVal.length === 1
      || ((lastSearch.length > 2) && (textVal.length < 3))
      || ((lastSearch.length < 3) && (textVal.length > 2))
      || ((textVal.length < lastSearch.length) && !lastSearch.startsWith(textVal))) {
      $textBox.autocomplete('option', 'source', []);
    }
  }

  if (typeof event['unitTest'] === 'undefined')
    languageSelectorTimer = setTimeout(languageSelectorTimeout, 500, event.target);
}

/**
 * Use a timeout to prevent unnecessary searching while typing
 * @param {HTMLInputElement} textBox
 */
function languageSelectorTimeout(textBox) {

  // reset the timer flag
  languageSelectorTimer = 0;

  var $textBox = $(textBox);
  var textVal = $textBox.val();

  // don't search for nothing
  if (textVal.length < 2) return;

  var lastSearch = $textBox.attr('data-last-search');

  // limit the search to the first 4 characters
  var thisSearch = (textVal.length > 4) ? textVal.substr(0, 4) : textVal;

  // if the search text has changed, refresh the list of languages
  if (thisSearch !== lastSearch) {

    $textBox.attr('data-last-search', thisSearch);
    getLanguageListItems($textBox);
  }
}

/**
 *
 * @param {Object} $textBox
 * @param results
 * @param {function} [callback]
 */
function processLanguages($textBox, results, callback) {

  var languages = [];
  var textVal = $textBox.val().toLowerCase();

  for (var i = 0; i < results.length; i++) {

    var langData = results[i];
    if ((textVal.length > 2) || (langData['lc'].toLowerCase().startsWith(textVal))) {
      langData['value'] = langData['ln'] + (langData['ang'] && langData['ang'] !== langData['ln'] ? ' - ' + langData['ang']:'') + ' (' + langData['lc'] +')';
      langData['label'] = langData['value'] + ' ' + langData['lr'];
      languages.push(langData);
    }
  }

  if (!$textBox.hasClass('ui-autocomplete-input')) {
    $textBox.autocomplete({
      minLength: 0
    }).autocomplete('instance')._renderItem = function( ul, item ) {
      return $('<li style="font-size: 0.9em;">')
        .append(item['ln'] + (item['ang'] && item['ang'] !== item['ln'] ? ' - ' + item['ang'] : '') + ' (' + item['lc'] + ')<br><span style="font-size: 0.9em;">Region: ' + item['lr'] + '</span>')
        .appendTo(ul);
    };
  }

  $textBox.autocomplete('option', 'source', languages.sort(function(a, b) { return sortLanguages(a, b, textVal); }));
  $textBox.autocomplete('search', textVal);

  if (typeof callback === 'function') {
    callback(languages);
  }
}

function sortLanguages(langA, langB, text) {

  // SORT THE LIST:
  // 4. exact language code match
  // 3. language code starts-with match
  // 2. language description starts-with
  // 1. language description contains
  // 0. sort the rest alphabetically

  var valA = 0, valB = 0;
  text = text.toLowerCase();
  var langA_code = langA['lc'].toLowerCase();
  var langB_code = langB['lc'].toLowerCase();

  // look for exact language code match
  if (langA_code === text) valA = 4;
  if (langB_code === text) valB = 4;

  // look for language code starts-with match
  if ((valA === 0) && langA_code.startsWith(text)) valA = 3;
  if ((valB === 0) && langB_code.startsWith(text)) valB = 3;

  // look for language description starts-with
  var langA_name = langA['ln'].toLowerCase();
  var langB_name = langB['ln'].toLowerCase();
  if ((valA === 0) && langA_name.startsWith(text)) valA = 2;
  if ((valB === 0) && langB_name.startsWith(text)) valB = 2;

  // look for language description contains
  var regex = new RegExp('.+' + text + '.*', 'i');
  if ((valA === 0) && (regex.test(langA_name))) valA = 1;
  if ((valB === 0) && (regex.test(langB_name))) valB = 1;

  var compare = valB - valA;
  if (compare !== 0) return compare;

  // if none of the above applies, try to sort alphabetically
  return langA_name.localeCompare(langB_name);
}

/**
 * Gets the list of language items from https://door43.org:9096
 * @param {Object} $textBox
 * @param {function|Spy} [callback]  Optional. Initially added for unit testing
 */
function getLanguageListItems($textBox, callback) {

  var request = {type: 'GET', url: 'https://door43.org:9096/?q=' + encodeURIComponent($textBox.val().toLowerCase())};

  $.ajax(request).done(function(data) {

    if (!data.results) return;

    processLanguages($textBox, data.results, callback);
  });
}


$().ready(function () {
  window.setTimeout(searchForResources(''), 300);
  window.setTimeout(setupLanguageSelector(), 500);

  $('#search-td').on('click', function (){
    var search_for = document.getElementById('search-for').value;

    // TODO: put actual search code here.
    alert('Search for "' + search_for + '".');
  });

  $('#browse-td').on('click', function (){

    // TODO: put actual browse code here.
    alert('Browse code goes here.');
  });
});