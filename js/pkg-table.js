/* Package contents table — renders into .pk-items-table[data-pkg-col="N"] */
/* data-pkg-col: 1=Furnishing 2=Basic Airbnb 3=High-End Airbnb 4=Donna Branka  */
/* data-limit="10" — show first N item rows with a link to contents.html        */
(function () {
  var COLS  = ['Item', 'Furnishing', 'Basic Airbnb', 'High-End Airbnb', 'Donna Branka'];
  var PRICE = [null, 13000, 32000, 59000, 85000];

  var ROWS = [
    ['Renovation, design & services', '', '', '', ''],
    ['Kitchen remodelling', 'X', 'X', '✓', '✓'],
    ['Bathroom remodelling', 'X', 'X', 'X', '✓'],
    ['Whitewash painting', 'X', '✓', '✓', '✓'],
    ['Coloured accent / feature wall', 'X', 'X', '✓', '✓'],
    ['New flooring / underlay / skirting', 'X', 'X', '✓', '✓'],
    ['New kitchen cabinets / worktop', 'X', 'X', '✓', '✓'],
    ['New kitchen wall panels / backsplash', 'X', 'X', '✓', '✓'],
    ['New kitchen sink / mixer / fittings', 'X', 'X', '✓', '✓'],
    ['Kitchen lighting / hardware', 'X', 'X', '✓', '✓'],
    ['New bathroom wall panels / surfaces', 'X', 'X', 'X', '✓'],
    ['Bathroom floor tiles / waterproofing', 'X', 'X', 'X', '✓'],
    ['Bathroom demolition', 'X', 'X', 'X', '✓'],
    ['New bathroom vanity / basin / taps', 'X', 'X', 'X', '✓'],
    ['New bathroom shower / sink mixers', 'X', 'X', 'X', '✓'],
    ['New bathroom ceiling / lights', 'X', 'X', 'X', '✓'],
    ['Bathroom LED mirror', 'X', 'X', 'X', '✓'],
    ['New WC spray / valve / hose', 'X', 'X', 'X', '✓'],
    ['Bathroom glass sliding door', 'X', 'X', 'X', '✓'],
    ['Shower glass wall', 'X', 'X', 'X', '✓'],
    ['New bathroom drains (2)', 'X', 'X', 'X', '✓'],
    ['Interior / entrance doors: repaint + panels', 'X', 'X', '✓', '✓'],
    ['Additional wall construction', 'X', 'X', 'X', '✓'],
    ['New light switches / international sockets', 'X', 'X', 'X', '✓'],
    ['Ambient ceiling lighting', 'X', 'X', 'X', '✓'],
    ['Coordinated lighting / added electrical points', 'X', 'X', '✓', '✓'],
    ['AC servicing', 'X', 'X', '✓', '✓'],
    ['Replace AC insulation', 'X', 'X', 'X', '✓'],
    ['Plumbing servicing', 'X', 'X', '✓', '✓'],
    ['Replacement of all angle valves', 'X', 'X', 'X', '✓'],
    ['Main-valve replacement', 'X', 'X', 'X', '✓'],
    ['Pest control', 'X', '✓', '✓', '✓'],
    ['Drainage cleaning', 'X', 'X', '✓', '✓'],
    ['Waste disposal / municipality fees', 'X', 'X', '✓', '✓'],
    ['Work permits / site protection / insurance', 'X', 'X', '✓', '✓'],
    ['Balcony grass / finishes', 'X', 'X', '✓', '✓'],
    ['Blackout curtains / tracks', 'X', '✓', '✓', '✓'],
    ['Guest keys / access / instructions', 'X', '✓', '✓', '✓'],
    ['Professional photography', 'X', 'X', '✓', '✓'],
    ['Furniture / layout selection', '✓', '✓', '✓', '✓'],
    ['Colour / kitchen design', 'X', 'X', '✓', '✓'],
    ['Full design / supervision', 'X', '✓', '✓', '✓'],
    ['Furniture delivery / assembly', '✓', '✓', '✓', '✓'],
    ['Installation fittings / checks', '✓', '✓', '✓', '✓'],
    ['Appliance installation / testing', 'X', '✓', '✓', '✓'],
    ['Testing / handover', '✓', '✓', '✓', '✓'],
    ['Final apartment cleaning', 'X', '✓', '✓', '✓'],
    ['Furniture', '', '', '', ''],
    ['TV unit (1)', '✓', '✓', '✓', '✓'],
    ['Dining table (1)', '✓', '✓', '✓', '✓'],
    ['Dining chairs (2)', '✓', '✓', '✓', '✓'],
    ['Standard sofa (1)', '✓', '✓', '✓', 'X'],
    ['Larger sofa (1)', 'X', 'X', 'X', '✓'],
    ['Coffee table (1)', '✓', '✓', '✓', '✓'],
    ['Bed frame (1)', '✓', '✓', '✓', '✓'],
    ['Mattress (1)', '✓', '✓', '✓', '✓'],
    ['Bedside tables (2)', '✓', '✓', '✓', '✓'],
    ['Drawer unit (1)', '✓', '✓', '✓', '✓'],
    ['Wardrobe (1)', '✓', '✓', '✓', '✓'],
    ['Shelves / cubes (2)', 'X', 'X', '✓', 'X'],
    ['Shelves / cubes (3)', 'X', 'X', 'X', '✓'],
    ['Mirrors (1)', 'X', '✓', '✓', 'X'],
    ['Mirrors (2)', 'X', 'X', 'X', '✓'],
    ['Balcony chairs (2)', 'X', 'X', '✓', '✓'],
    ['Balcony table (1)', 'X', 'X', '✓', '✓'],
    ['Appliances, lamps & electronics', '', '', '', ''],
    ['Ceiling light fixtures (2)', 'X', '✓', '✓', '✓'],
    ['TV (1)', 'X', '✓', '✓', '✓'],
    ['Floor lamp (1)', 'X', 'X', '✓', '✓'],
    ['Bedside lamps (2)', 'X', '✓', '✓', '✓'],
    ['Glass cooker / hob (1)', 'X', '✓', '✓', '✓'],
    ['Extractor hood (1)', 'X', '✓', '✓', '✓'],
    ['Water heater (1)', 'X', '✓', '✓', '✓'],
    ['Fridge (1)', 'X', '✓', '✓', '✓'],
    ['Washing machine (1)', 'X', '✓', '✓', '✓'],
    ['Microwave (1)', 'X', '✓', '✓', '✓'],
    ['Toaster (1)', 'X', 'X', '✓', '✓'],
    ['Kettle (1)', 'X', '✓', '✓', '✓'],
    ['Power strips (1)', 'X', '✓', 'X', 'X'],
    ['Power strips (2)', 'X', 'X', '✓', 'X'],
    ['Power strips (4)', 'X', 'X', 'X', '✓'],
    ['Spare bulbs (2)', 'X', '✓', '✓', '✓'],
    ['AC thermostat (1)', 'X', '✓', '✓', '✓'],
    ['Bedding, towels & textiles', '', '', '', ''],
    ['Mattress protector (1)', 'X', '✓', '✓', '✓'],
    ['Sleeping pillows (2)', 'X', '✓', 'X', 'X'],
    ['Sleeping pillows (4)', 'X', 'X', '✓', '✓'],
    ['Pillow protectors (2)', 'X', '✓', 'X', 'X'],
    ['Pillow protectors (4)', 'X', 'X', '✓', '✓'],
    ['Duvet (1)', 'X', '✓', '✓', '✓'],
    ['Sheets (1)', 'X', '✓', 'X', 'X'],
    ['Sheets (2)', 'X', 'X', '✓', '✓'],
    ['Duvet covers (1)', 'X', '✓', 'X', 'X'],
    ['Duvet covers (2)', 'X', 'X', '✓', '✓'],
    ['Pillowcases (2)', 'X', '✓', 'X', 'X'],
    ['Pillowcases (8)', 'X', 'X', '✓', '✓'],
    ['Large towels (2)', 'X', '✓', 'X', 'X'],
    ['Large towels (4)', 'X', 'X', '✓', '✓'],
    ['Small towels (2)', 'X', '✓', 'X', 'X'],
    ['Small towels (4)', 'X', 'X', '✓', '✓'],
    ['Sofa cushions (2)', 'X', '✓', 'X', 'X'],
    ['Sofa cushions (4)', 'X', 'X', '✓', 'X'],
    ['Sofa cushions (6)', 'X', 'X', 'X', '✓'],
    ['Decorative bed cushions (2)', 'X', 'X', 'X', '✓'],
    ['Throws (1)', 'X', 'X', '✓', 'X'],
    ['Throws (2)', 'X', 'X', 'X', '✓'],
    ['Prayer mat (1)', 'X', '✓', '✓', '✓'],
    ['Doormat (1)', 'X', '✓', '✓', '✓'],
    ['Kitchen & dining small items', '', '', '', ''],
    ['Large plates (2)', 'X', '✓', 'X', 'X'],
    ['Large plates (4)', 'X', 'X', '✓', '✓'],
    ['Small plates (2)', 'X', '✓', 'X', 'X'],
    ['Small plates (4)', 'X', 'X', '✓', '✓'],
    ['Bowls (2)', 'X', '✓', 'X', 'X'],
    ['Bowls (4)', 'X', 'X', '✓', '✓'],
    ['Water glasses (2)', 'X', '✓', 'X', 'X'],
    ['Water glasses (4)', 'X', 'X', '✓', '✓'],
    ['Wine glasses (2)', 'X', 'X', '✓', 'X'],
    ['Wine glasses (4)', 'X', 'X', 'X', '✓'],
    ['Mugs (2)', 'X', '✓', 'X', 'X'],
    ['Mugs (4)', 'X', 'X', '✓', '✓'],
    ['Forks (2)', 'X', '✓', 'X', 'X'],
    ['Forks (4)', 'X', 'X', '✓', '✓'],
    ['Table knives (2)', 'X', '✓', 'X', 'X'],
    ['Table knives (4)', 'X', 'X', '✓', '✓'],
    ['Tablespoons (2)', 'X', '✓', 'X', 'X'],
    ['Tablespoons (4)', 'X', 'X', '✓', '✓'],
    ['Teaspoons (2)', 'X', '✓', 'X', 'X'],
    ['Teaspoons (4)', 'X', 'X', '✓', '✓'],
    ['Cutlery tray (1)', 'X', '✓', '✓', '✓'],
    ['Spatula (1)', 'X', '✓', '✓', '✓'],
    ['Serving spoon (1)', 'X', '✓', '✓', '✓'],
    ['Strainer (1)', 'X', '✓', '✓', '✓'],
    ['Chopping board (1)', 'X', '✓', '✓', '✓'],
    ['Cutting knife (1)', 'X', '✓', '✓', '✓'],
    ['Scissors (1)', 'X', 'X', '✓', '✓'],
    ['Peeler (1)', 'X', '✓', '✓', '✓'],
    ['Corkscrew (1)', 'X', 'X', '✓', '✓'],
    ['Colander (1)', 'X', 'X', '✓', '✓'],
    ['Coasters (2)', 'X', 'X', '✓', 'X'],
    ['Coasters (4)', 'X', 'X', 'X', '✓'],
    ['Oven mitts (2)', 'X', '✓', '✓', '✓'],
    ['Kitchen paper stand (1)', 'X', '✓', '✓', '✓'],
    ['Placemats (2)', 'X', 'X', '✓', 'X'],
    ['Placemats (4)', 'X', 'X', 'X', '✓'],
    ['Kitchen waste bin (1)', 'X', '✓', '✓', '✓'],
    ['Dish drainer (1)', 'X', '✓', '✓', '✓'],
    ['Frying pan (1)', 'X', '✓', '✓', '✓'],
    ['Saucepans (1)', 'X', '✓', 'X', 'X'],
    ['Saucepans (2)', 'X', 'X', '✓', '✓'],
    ['Saucepan lids (1)', 'X', '✓', 'X', 'X'],
    ['Saucepan lids (2)', 'X', 'X', '✓', '✓'],
    ['Oven dishes (1)', 'X', 'X', '✓', 'X'],
    ['Oven dishes (2)', 'X', 'X', 'X', '✓'],
    ['Reusable chopsticks (4)', 'X', 'X', 'X', '✓'],
    ['Bathroom accessories', '', '', '', ''],
    ['Bathroom bin (1)', 'X', '✓', '✓', '✓'],
    ['Laundry hamper (1)', 'X', 'X', '✓', '✓'],
    ['Toilet brush (1)', 'X', '✓', '✓', '✓'],
    ['Toilet-brush holder (1)', 'X', '✓', '✓', '✓'],
    ['Toilet seat (1)', 'X', '✓', '✓', '✓'],
    ['Toilet-roll holder (1)', 'X', '✓', '✓', '✓'],
    ['Towel rail (1)', 'X', '✓', '✓', '✓'],
    ['Toothbrush cup (1)', 'X', '✓', '✓', '✓'],
    ['Toothbrush-cup holder (1)', 'X', '✓', '✓', '✓'],
    ['Soap dish (1)', 'X', '✓', '✓', '✓'],
    ['Soap-dish holder (1)', 'X', '✓', '✓', '✓'],
    ['Shower storage basket / shelf (1)', 'X', '✓', '✓', '✓'],
    ['Bathroom hooks (2)', 'X', '✓', '✓', '✓'],
    ['Shower squeegee (1)', 'X', '✓', '✓', '✓'],
    ['Household, safety & decoration', '', '', '', ''],
    ['Hangers (6)', 'X', '✓', 'X', 'X'],
    ['Hangers (8)', 'X', 'X', '✓', 'X'],
    ['Hangers (12)', 'X', 'X', 'X', '✓'],
    ['Ashtray (1)', '✓', '✓', '✓', '✓'],
    ['First-aid kit (1)', 'X', '✓', '✓', '✓'],
    ['Fire extinguisher (1)', 'X', '✓', '✓', '✓'],
    ['Fire blanket (1)', 'X', '✓', '✓', '✓'],
    ['Iron (1)', 'X', '✓', '✓', '✓'],
    ['Ironing board (1)', 'X', '✓', '✓', '✓'],
    ['Hair dryer (1)', 'X', '✓', '✓', '✓'],
    ['Drying rack (1)', 'X', '✓', '✓', '✓'],
    ['Mop (1)', 'X', '✓', '✓', '✓'],
    ['Bucket (1)', 'X', '✓', '✓', '✓'],
    ['Vacuum cleaner (1)', 'X', 'X', '✓', '✓'],
    ['Alarm clock (1)', 'X', 'X', 'X', '✓'],
    ['Keybox (1)', 'X', '✓', '✓', '✓'],
    ['Dustpan (1)', 'X', '✓', '✓', '✓'],
    ['Brush for dustpan (1)', 'X', '✓', '✓', '✓'],
    ['Wall art (1)', 'X', '✓', 'X', 'X'],
    ['Wall art (3)', 'X', 'X', '✓', 'X'],
    ['Wall art (5)', 'X', 'X', 'X', '✓'],
    ['Bathroom artificial plant (1)', 'X', 'X', '✓', '✓'],
    ['Tissue-box cover (1)', 'X', 'X', '✓', '✓'],
    ['Living-area decorative plants (1)', 'X', 'X', '✓', 'X'],
    ['Living-area decorative plants (2)', 'X', 'X', 'X', '✓'],
    ['Decorative vases (1)', 'X', 'X', '✓', 'X'],
    ['Decorative vases (2)', 'X', 'X', 'X', '✓']
  ];

  function check(v) {
    if (v === '✓') return '<span class="pkt-yes" aria-label="Included">✓</span>';
    if (v === 'X') return '<span class="pkt-no" aria-label="Not included">—</span>';
    return '';
  }

  function render(el) {
    var col   = parseInt(el.getAttribute('data-pkg-col'), 10);
    var limit = parseInt(el.getAttribute('data-limit')  || '0', 10);

    var html = '<div class="pkt-search"><input class="pkt-search__input" type="search"'
      + ' placeholder="Search items — e.g. washing machine, fridge…"'
      + ' aria-label="Search package contents" autocomplete="off" spellcheck="false"></div>';
    html += '<div class="pkt-wrap"><table class="pkt"><thead><tr><th class="pkt-item">Item</th>';
    for (var c = 1; c <= 4; c++) {
      html += '<th class="pkt-pkg' + (c === col ? ' pkt-pkg--active' : '') + '">' + COLS[c] + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (var r = 0; r < ROWS.length; r++) {
      var row = ROWS[r];
      if (row[1] === '') {
        html += '<tr class="pkt-section"><td colspan="5">' + row[0] + '</td></tr>';
      } else {
        html += '<tr data-item="' + row[0].toLowerCase() + '">';
        html += '<td class="pkt-item">' + row[0] + '</td>';
        for (var c2 = 1; c2 <= 4; c2++) {
          html += '<td class="pkt-cell' + (c2 === col ? ' pkt-cell--active' : '') + '">' + check(row[c2]) + '</td>';
        }
        html += '</tr>';
      }
    }
    html += '<tr class="pkt-price"><td class="pkt-item">Estimate total (AED)</td>';
    for (var c3 = 1; c3 <= 4; c3++) {
      html += '<td class="pkt-cell pkt-cell--price' + (c3 === col ? ' pkt-cell--active' : '') + '">' + PRICE[c3].toLocaleString() + '</td>';
    }
    html += '</tr>';
    html += '<tr class="pkt-empty" style="display:none"><td colspan="5">No items found.</td></tr>';
    html += '</tbody></table></div>';

    if (limit) {
      html += '<div class="pkt-more"><a class="pkt-more__link" href="contents.html?pkg=' + col + '">'
        + 'See full list — all ' + (ROWS.length - 7) + ' items</a></div>';
    }

    el.innerHTML = html;

    var input  = el.querySelector('.pkt-search__input');
    var tbody  = el.querySelector('tbody');
    var moreEl = el.querySelector('.pkt-more');

    function update(q) {
      var active = q !== '';
      var itemCount = 0;
      var anyMatch  = false;

      /* Mark item rows */
      for (var i = 0; i < tbody.rows.length; i++) {
        var row = tbody.rows[i];
        if (row.classList.contains('pkt-section') || row.classList.contains('pkt-price') || row.classList.contains('pkt-empty')) continue;
        itemCount++;
        var overLimit  = !active && limit > 0 && itemCount > limit;
        var searchHit  = !active || (row.getAttribute('data-item') || '').indexOf(q) !== -1;
        row.style.display = (searchHit && !overLimit) ? '' : 'none';
        if (searchHit && !overLimit) anyMatch = true;
        if (searchHit && active)     anyMatch = true;
      }

      /* Show/hide section headers */
      var sections = tbody.querySelectorAll('.pkt-section');
      for (var s = 0; s < sections.length; s++) {
        var sec     = sections[s];
        var hasVis  = false;
        var sibling = sec.nextElementSibling;
        while (sibling && !sibling.classList.contains('pkt-section')
               && !sibling.classList.contains('pkt-price')
               && !sibling.classList.contains('pkt-empty')) {
          if (sibling.style.display !== 'none') { hasVis = true; break; }
          sibling = sibling.nextElementSibling;
        }
        sec.style.display = hasVis ? '' : 'none';
      }

      var priceRow = tbody.querySelector('.pkt-price');
      var emptyRow = tbody.querySelector('.pkt-empty');
      if (priceRow) priceRow.style.display = anyMatch ? '' : 'none';
      if (emptyRow) emptyRow.style.display = anyMatch ? 'none' : '';
      if (moreEl)   moreEl.style.display   = (active || !limit) ? 'none' : '';
    }

    update('');
    input.addEventListener('input', function () { update(this.value.toLowerCase().trim()); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var els = document.querySelectorAll('.pk-items-table');
    for (var i = 0; i < els.length; i++) render(els[i]);
  });
})();
