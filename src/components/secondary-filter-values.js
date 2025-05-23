secondayFilterValues = Vue.component('secondary-filters', {
    props: ['websiteText', 'fallbackText', 'classValue', 'classLabel', 'secondaryFilter', 'currentFilter', 'totalValues', 'appliedFilters', 'appliedRanges', 'appliedQuantities', 'format'],
    data() {
        return {
            items: [],
            itemsType: '',
            fullPropertyValues: [],
            displayCount: 1,
            currentPage: 1,
            filterProperty: '',
            query: '#',
            noValueURL: '',
            filterValue: '',
            searchResults: ''
        }
    },
    template: `
    <div v-if="websiteText!=''">
        <header-view
            :class-label="classLabel"
            :applied-filters="appliedFilters"
            :applied-ranges="appliedRanges"
            :applied-quantities="appliedQuantities"
            @remove-filter="removeFilter"
            @remove-range="removeRange"
            @remove-quantity="removeQuantity"
            @change-page="changePage"
        >
        </header-view>
        <div class="content">
            <div v-if="itemsType=='' || itemsType=='ItemLoading'">
                <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                <p v-html="displayMessage(websiteText.gettingValues||fallbackText.gettingValues, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                <div v-if="itemsType=='ItemLoading'" class="filterValueInputWrapper">
                    <p v-html="websiteText.customFilterValue||fallbackText.customFilterValue"></p>
                    <div class="filterValueInput">
                        <input
                            v-model="filterValue"
                            @input="showFilterValues"
                            type="search"
                            :placeholder='websiteText.filterValuePlaceholder||fallbackText.filterValuePlaceholder'>
                    </div>
                    <div v-if="filterValue.length>0" class="searchOptions">
                        <a
                            class="searchOption"
                            v-for="searchResult in searchResults"
                            @click="submitFreeFormFilterValue(searchResult)">
                                <b>
                                    {{ searchResult.label.replace(/^./, searchResult.label[0].toUpperCase()) }}
                                </b>
                                : {{ searchResult.description }}
                        </a>
                    </div>
                </div>
                <img src='images/loading.gif'>
            </div>
            <div v-else-if="itemsType=='Additionalempty'">
                <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                <p v-html="displayMessage(websiteText.noAdditionalValues||fallbackText.noAdditionalValues, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
            </div>
            <div v-else-if="itemsType=='Error'">
                <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                <p v-html="displayMessage(websiteText.filterError||fallbackText.filterError, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
            </div>
            <div v-else>
                <div v-if="itemsType=='Item'">
                    <p v-if="totalValues" v-html="displayPluralCount(websiteText.itemCount||fallbackText.itemCount, totalValues, true)"></p>
                    <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                    <p v-if="appliedFilters.findIndex(filter => filter.filterValue == secondaryFilter.value) != -1" v-html="displayMessage(websiteText.selectAdditionalValue||fallbackText.selectAdditionalValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <p v-else v-html="displayMessage(websiteText.selectValue||fallbackText.selectValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <div v-if="items.length > 150" class="filterValueInputWrapper">
                        <p v-html="websiteText.customFilterValue||fallbackText.customFilterValue"></p>
                        <div class="filterValueInput">
                            <input
                                v-model="filterValue"
                                @input="showFilterValues"
                                type="search"
                                :placeholder='websiteText.filterValuePlaceholder||fallbackText.filterValuePlaceholder'>
                        </div>
                        <div v-if="filterValue.length>0" class="searchOptions">
                            <a
                                class="searchOption"
                                v-for="searchResult in searchResults"
                                @click="submitFreeFormFilterValue(searchResult)">
                                    <b>
                                        {{ searchResult.label.replace(/^./, searchResult.label[0].toUpperCase()) }}
                                    </b>
                                    : {{ searchResult.description }}
                            </a>
                        </div>
                    </div>                    
                    <div v-if="items.length > resultsPerPage && itemsType=='Item'" style="text-align: center">
                        <a v-if="currentPage > 1" @click="goToPreviousPage()">&lt;</a>
                        <input
                            v-model.lazy="currentPage"
                            @change="pageChanged($event)"
                            type="text"
                            style="margin-bottom: 15px ;width: 48px; text-align: center;">
                        {{items.length < 1000000 ? " / " + Math.ceil(items.length/resultsPerPage) : ''}}
                        <a v-if="currentPage < items.length/resultsPerPage" @click="goToNextPage()">&gt;</a>
                    </div>
                    <ul>
                        <li v-for="(item,index) in items" v-if="index < currentPage*resultsPerPage && index >= (currentPage-1)*resultsPerPage">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyFilter(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.valueLabel.value}}
                            </a> 
                            <span class="result-count">
                                {{ displayPluralCount(websiteText.results||fallbackText.results, item.count.value, false) }}
                            <span>
                        </li>
                    </ul>
                </div>
                <div v-else-if="itemsType=='ItemFail'">
                    <p><i v-html="displayMessage(websiteText.filterTimeout||fallbackText.filterTimeout, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></i></p>
                    <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                    <p v-html="displayMessage(websiteText.selectValue||fallbackText.selectValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <div class="filterValueInputWrapper">
                        <p v-html="websiteText.customFilterValue||fallbackText.customFilterValue"></p>
                        <div class="filterValueInput">
                            <input
                                v-model="filterValue"
                                @input="showFilterValues"
                                style="border: none;outline: none;width: 100%;font-size:1em"
                                type="search"
                                :placeholder='websiteText.filterValuePlaceholder||fallbackText.filterValuePlaceholder'>
                        </div>
                        <div v-if="filterValue.length>0" class="searchOptions">
                            <a
                                class="searchOption"
                                v-for="searchResult in searchResults"
                                @click="submitFreeFormFilterValue(searchResult)">
                                    <b>
                                        {{ searchResult.label.replace(/^./, searchResult.label[0].toUpperCase()) }}
                                    </b>
                                    : {{ searchResult.description }}
                            </a>
                        </div>
                    </div>
                    <ul>
                        <li v-for="item in items">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyFilter(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.valueLabel.value}}
                            </a>
                        </li>
                    </ul>
                </div>
                <div v-else-if="itemsType=='Time'">
                    <p v-if="totalValues" v-html="displayPluralCount(websiteText.itemCount||fallbackText.itemCount, totalValues, true)"></p>
                    <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                    <p v-html="displayMessage(websiteText.selectValue||fallbackText.selectValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <ul v-if="displayCount == 1">
                        <li v-for="item in items" v-if="item.numValues>0">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyRange(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.bucketName}} 
                            </a> 
                            <span class="result-count">
                                {{ displayPluralCount(websiteText.results||fallbackText.results, item.numValues, false) }}
                            <span>
                        </li>
                    </ul>
                    <ul v-if="displayCount == 0">
                        <li v-for="item in items">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyRange(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.bucketName}} 
                            </a>
                        </li>
                    </ul>
                </div>
                <div v-else-if="itemsType=='TimeFail'">
                    <p><i v-html="displayMessage(websiteText.filterTimeout||fallbackText.filterTimeout, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></i></p>
                    <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                    <p v-html="displayMessage(websiteText.selectValue||fallbackText.selectValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <ul>
                        <li v-for="item in items">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyRange(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.bucketName}} 
                            </a>
                        </li>
                    </ul>
                </div>
                <div v-else-if="itemsType=='Quantity'">
                    <p v-if="(displayCount == 1) && totalValues" v-html="displayPluralCount(websiteText.itemCount||fallbackText.itemCount, totalValues, true)"></p>
                    <p v-if="displayCount == 0"><i v-html="displayMessage(websiteText.filterTimeout||fallbackText.filterTimeout, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></i></p>
                    <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                    <p v-html="displayMessage(websiteText.selectValue||fallbackText.selectValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <ul v-if="displayCount == 1">
                        <li v-for="item in items" v-if="item.numValues>0">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyQuantityRange(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.bucketName}} {{item.unit}} 
                            </a> 
                            <span class="result-count">
                                {{ displayPluralCount(websiteText.results||fallbackText.results, item.numValues, false) }}
                            <span>
                        </li>
                    </ul>
                    <ul v-if="displayCount == 0">
                        <li v-for="item in items">
                            <a 
                                :href="item.href" 
                                onclick="return false;" 
                                @click.exact="applyQuantityRange(item)" 
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.bucketName}} 
                            </a>
                        </li>
                    </ul>
                </div>
                <div v-else-if="itemsType=='QuantityFail'">
                    <p><i v-html="displayMessage(websiteText.filterTimeout||fallbackText.filterTimeout, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></i></p>
                    <a @click="changePage('view-all-items')">{{ viewItemsText() }}</a>
                    <p v-html="displayMessage(websiteText.selectValue||fallbackText.selectValue, currentFilter.valueLabel + arrow + secondaryFilter.valueLabel)"></p>
                    <ul>
                        <li v-for="item in items">
                            <a
                                :href="item.href"
                                onclick="return false;"
                                @click.exact="applyQuantityRange(item)"
                                @click.ctrl="window.open(item.href, '_blank')">
                                {{item.bucketName}}
                            </a>
                        </li>
                    </ul>
                </div>
                <div v-if="items.length>resultsPerPage && itemsType=='Item'" style="text-align: center">
                    <a v-if="currentPage > 1" @click="goToPreviousPage()">&lt;</a>
                    <input
                        v-model.lazy="currentPage"
                        @change="pageChanged($event)"
                        type="text"
                        style="margin-bottom: 15px; width: 48px; text-align: center;">
                    {{items.length < 1000000 ? " / " + Math.ceil(items.length/resultsPerPage) : ''}}
                    <a v-if="currentPage < items.length/resultsPerPage" @click="goToNextPage()">&gt;</a>
                </div>
                <div><a @click="exportCSV">Export as CSV</a></div>
            </div>
            <div><a :href="query">{{ websiteText.viewQuery||fallbackText.viewQuery }}</a></div>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        displayMessage(message, value) {
            if(message){
                return message.replace("$1", "<b>" + value + "</b>")
            }
        },
        viewItemsText() {
            // Show "Back to main page" if there have been no filters applied,
            // and there's text on the main page - i.e., there is no list to see.
            if ( window.mainPageText && this.appliedFilters.length == 0 && this.appliedRanges.length == 0 && this.appliedQuantities.length == 0 ) {
                return this.websiteText.backToMain || this.fallbackText.backToMain;
            } else {
                return this.websiteText.viewList || this.fallbackText.viewList;
            }
        },
        applyFilter(filter) {
            this.$emit('apply-secondary-filter', filter)
        },
        applyRange(range) {
            this.$emit('apply-secondary-range', range)
        },
        applyQuantityRange(range) {
            this.$emit('apply-secondary-quantity', range)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'secondary-filter-values');
        },
        removeRange(range) {
            this.$emit("remove-range", range, 'filter-values');
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity, 'secondary-filter-values');
        },
        showFilterValues() {
            if (this.filterValue.length > 0) {
                const fullURL = entityAPIURL + '?action=wbsearchentities&origin=*&format=json&language=' +
                        lang.split(",")[0] + '&uselang=' + lang.split(",")[0] +
                        '&type=item&search=' + this.filterValue;
                axios.get(fullURL)
                    .then(response => {
                        this.searchResults = [...response.data['search']]
                    })
            }
        },
        submitFreeFormFilterValue(searchResult) {
            var filter = {
                value: {
                        value: searchResult.url
                },
                valueLabel: {
                        value: searchResult.label
                }
            };
            this.$emit('apply-secondary-filter', filter);
        },
        exportCSV() {
            document.getElementsByTagName("body")[0].style.cursor = "progress";
            let csvHeader = encodeURI("data:text/csv;charset=utf-8,");
            if (this.itemsType == 'Item' || this.itemsType == 'ItemFail') {
                var csvContent = this.items.map(e => e.value.value.split('/').slice(-1)[0] + "," + `\"${e.valueLabel.value}\"` + (this.displayCount == 1 ? "," + e.count.value : '')).join("\n");
            }
            else if (this.itemsType == 'Time' || this.itemsType == 'TimeFail') {
                var csvContent = this.items.map(e => `\"${e.bucketName}\" ` + (this.displayCount == 1 ? "," + e.numValues : '')).join("\n");
            }
            else if (this.itemsType == 'Quantity' || this.itemsType == 'QuantityFail') {
                var csvContent = this.items.map(e => `\"${e.bucketName}\" ` + e.unit + (this.displayCount == 1 ? "," + e.numValues : '')).join("\n");
            }
            let downloadURI = csvHeader + encodeURIComponent(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", downloadURI);
            link.setAttribute("download", "data.csv");
            document.body.appendChild(link);
            link.click();
            document.getElementsByTagName("body")[0].style.cursor = "default";
        },
        pageChanged($event) {
            this.currentPage = parseInt(this.currentPage);
            if (!Number.isInteger(this.currentPage) || this.currentPage < 1) {
                this.currentPage = 1;
            }
            var numPages = Math.ceil(this.items.length / resultsPerPage);
            if (this.currentPage > numPages) {
                this.currentPage = numPages;
            }
            var queryString = window.location.search;
            cachedFilterValues[queryString]['currentPage'] = this.currentPage;
        },
        goToNextPage() {
            if (this.currentPage >= Math.ceil(this.items.length / resultsPerPage)) {
                return;
            }
            this.currentPage++;
            var queryString = window.location.search;
            cachedFilterValues[queryString]['currentPage'] = this.currentPage;
        },
        goToPreviousPage() {
            if (this.currentPage <= 1) {
                return;
            }
            this.currentPage--;
            var queryString = window.location.search;
            cachedFilterValues[queryString]['currentPage'] = this.currentPage;
        },
    },
    mounted() {
        // Escape if the user has been here before, and thus the set of
        // filter values has already been stored.
        var queryString = window.location.search;
        if ( cachedFilterValues.hasOwnProperty(queryString) ) {
            this.items = cachedFilterValues[queryString]['items'];
            this.itemsType = cachedFilterValues[queryString]['itemsType'];
            this.currentPage = cachedFilterValues[queryString]['currentPage'] ?? 1;
            this.displayCount = 1;
            return;
        }

        if ( noClasses ) {
            this.classSelector = '';
        } else {
            // Find items both in this class and in any of its subclasses.
            this.classSelector = "{\n" +
                "    ?item wdt:" + instanceOf + " wd:" + this.classValue + "\n" +
                "} UNION {\n" +
                "    ?item wdt:" + instanceOf + " ?subclass .\n" +
                "    ?subclass wdt:" + subclassOf + " wd:" + this.classValue + "\n" +
                "}\n";
        }

        // Convert the applied filters/time ranges/quantities into SPARQL equivalents
        var filterString = "";
        var parentFilterString = "";
        var noValueString = "";
        for (let i = 0; i < this.appliedFilters.length; i++) {
            if (this.appliedFilters[i].parentFilterValue) {
                if (centralSPARQLService) {
                    filterString += "{#filter " + i + "\n?item wdt:" + this.appliedFilters[i].parentFilterValue + " ?temp" + i + ".\n" +
                        "?temp" + i + " wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n}";
                } else {
                    filterString += "{#filter " + i + "\n?item wdt:" + this.appliedFilters[i].parentFilterValue + " ?temp" + i + ".\n}\n";
                    parentFilterString += "?temp" + i + " wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n";
                }
            }
            else if (this.appliedFilters[i].value == "novalue") {
                noValueString += "{#filter " + i +"\n FILTER(NOT EXISTS { ?value wdt:" + this.appliedFilters[i].filterValue + " ?no. }).\n}"
            }
            else {
                filterString += "{#filter " + i +"\n?item wdt:" + this.appliedFilters[i].filterValue + " wd:" + this.appliedFilters[i].value + ".\n}";
            }
        }
        var filterRanges = "";
        timeString = "?temp wdt:" + this.secondaryFilter.value + " ?time.\n";
        for (let i = 0; i < this.appliedRanges.length; i++) {
            if (this.appliedRanges[i].valueLL == "novalue") {
                noValueString += "{#date range " + i +"\n FILTER(NOT EXISTS { ?item wdt:" + this.appliedRanges[i].filterValue + " ?no. }).\n}"
            }
            else if (this.appliedRanges[i].parentFilterValue) {
                timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL, 1)
                filterRanges += "{#date range " + i + "\n?item wdt:" + this.appliedRanges[i].parentFilterValue + " ?temp" + i + ".\n" +
                    "?temp" + i + " (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                    "FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " <= '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n}";
            }
            else if (this.appliedRanges[i].filterValue != this.secondaryFilter.value) {
                timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL,1)
                filterRanges += "{#date range " + i +"\n?item (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timeValue ?time" + i + ".\n" +
                    "  ?timenode" + i + " wikibase:timePrecision ?timeprecision" + i + ".\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time" + i + " && ?time" + i + " <= '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "  FILTER(?timeprecision" + i + ">=" + timePrecision + ")\n}";
            }
            else {
                timePrecision = getTimePrecision(this.appliedRanges[i].valueLL, this.appliedRanges[i].valueUL,1)
                timeString = "{#date range " + i +"\n?item (p:" + this.appliedRanges[i].filterValue + "/psv:" + this.appliedRanges[i].filterValue + ") ?timenode.\n" +
                    "  ?timenode wikibase:timeValue ?time.\n" +
                    "  ?timenode wikibase:timePrecision ?timeprecision.\n" +
                    "  FILTER('" + this.appliedRanges[i].valueLL + "'^^xsd:dateTime <= ?time && ?time <= '" + this.appliedRanges[i].valueUL + "'^^xsd:dateTime).\n" +
                    "  FILTER(?timeprecision>=" + timePrecision + ")\n}";
            }
        }

        if (centralSPARQLService) {
            timeString = "SERVICE <" + centralSPARQLService + "> {\n" +
                timeString +
                "\n}\n";
        }

        var filterQuantities = "";
        for (let i = 0; i < this.appliedQuantities.length; i++) {
            if (this.appliedQuantities[i].parentFilterValue) {
                if (this.appliedQuantities[i].valueLL == "novalue") {
                    noValueString += "{#quantity range " + i +"\n FILTER(NOT EXISTS { ?temp" + i + " wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n}"
                }
                else if (this.appliedQuantities[i].unit == "") {
                    filterQuantities += "{#quantity range " + i +"\n?item wdt:" + this.appliedQuantities[i].parentFilterValue + " ?temp" + i + ".\n" +
                        "?temp" + i + " (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
                else {
                    filterQuantities += "{#quantity range " + i +"\n?item wdt:" + this.appliedQuantities[i].parentFilterValue + " ?temp" + i + ".\n" +
                        "?temp" + i + " (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
            }
            else {
                if (this.appliedQuantities[i].valueLL == "novalue") {
                    noValueString += "{#quantity range " + i +"\n FILTER(NOT EXISTS { ?item wdt:" + this.appliedQuantities[i].filterValue + " ?no. }).\n}"
                }
                else if (this.appliedQuantities[i].unit == "") {
                    filterQuantities += "{#quantity range " + i +"\n?item (p:" + this.appliedQuantities[i].filterValue + "/psv:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
                else {
                    filterQuantities += "{#quantity range " + i +"\n?item (p:" + this.appliedQuantities[i].filterValue + "/psn:" + this.appliedQuantities[i].filterValue + ") ?amount" + i + ".\n" +
                        "  ?amount" + i + " wikibase:quantityAmount ?amountValue" + i + ".\n" +
                        "FILTER(" + this.appliedQuantities[i].valueUL + " >= ?amountValue" + i + " && ?amountValue" + i + " >" + this.appliedQuantities[i].valueLL + ")\n}"
                }
            }
        }
        // Get the property type for current filter
        sparqlQuery = "SELECT ?property WHERE {\n" +
            "  wd:" + this.secondaryFilter.value + " wikibase:propertyType ?property.\n" +
            "}";
        var fullUrl = centralSPARQLEndpoint + encodeURIComponent(sparqlQuery);
        var vm = this;
        axios.get(fullUrl)
            .then((response) => {
                var propertyType = response.data['results']['bindings'][0].property.value.split("#")[1];
                if (propertyType == "Time") {
                    // Time property type
                    // Set the URL parameters for href attribute, i.e., only for display purpose. 
                    var q = window.location.search;
                    parameters = new URLSearchParams(q)
                    parameters.delete("cf")
                    parameters.delete("sf")
                    parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, "novalue")
                    vm.noValueURL = window.location.pathname + "?" + parameters
                    
                    var sparqlQuery = "SELECT ?time WHERE {\n" +
                        vm.classSelector +
                        "?item wdt:" + vm.currentFilter.value +" ?temp.\n" +
                        filterString +
                        filterRanges +
                        timeString +
                        filterQuantities +
                        noValueString +
                        "}\n" +
                        "ORDER by ?time";
                    vm.query = queryServiceWebsiteURL + encodeURIComponent(sparqlQuery);
                    const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            if (response.data['results']['bindings'].length) {
                                arr = generateDateBuckets(response.data['results']['bindings'])
                                // Set the href parameter of each bucket.
                                for (var i = 0; i < arr.length; i++) {
                                    var q = window.location.search;
                                    parameters = new URLSearchParams(q)
                                    parameters.delete("cf")
                                    parameters.delete("sf")
                                    if (arr[i].size == 1) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "~" + arr[i].bucketUL.year)
                                    else if (arr[i].size == 2) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year)
                                    else if (arr[i].size == 3) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month)
                                    else if (arr[i].size == 4) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                    else if (arr[i].size == 5) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                }
                                if (arr.length) {
                                    vm.items = arr;
                                    vm.itemsType = 'Time'
                                    vm.displayCount = 1;
                                    cachedFilterValues[queryString] = {items: vm.items, itemsType: "Time"};
                                }
                                else {
                                    vm.itemsType = 'Additionalempty'
                                }
                            }
                            else {
                                // Check if "No value" is to be displayed or not.
                                index = vm.appliedRanges.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                if (index == -1) vm.itemsType = "Additionalempty"
                                else vm.itemsType = 'Time'
                            }
                        })
                        .catch(_error => {
                            /*
                             Gets fallback results in case the primary query fails or times out.
                             Finds random time values and creates buckets.
                            */
                            sparqlQuery = "SELECT ?time WHERE{SELECT ?time WHERE {\n" +
                                "  hint:Query hint:optimizer \"None\".\n" +
                                vm.classSelector +
                                "?item wdt:" + vm.currentFilter.value + " ?temp.\n" +
                                filterString +
                                "?temp wdt:" + vm.secondaryFilter.value + " ?time.\n" +
                                filterRanges +
                                filterQuantities +
                                "}\n" +
                                "LIMIT " + resultsPerPage + "\n" +
                                "}\n" +
                                "ORDER BY ?time";
                            fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                            axios.get(fullUrl)
                                .then(res => {
                                    if (res.data['results']['bindings'].length) {
                                        arr = generateDateBuckets(res.data['results']['bindings'], vm.secondaryFilter)
                                        // Set the href parameter of each bucket.
                                        for (var i = 0; i < arr.length; i++) {
                                            var q = window.location.search;
                                            parameters = new URLSearchParams(q)
                                            parameters.delete("cf")
                                            parameters.delete("sf")
                                            if (arr[i].size == 1) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "~" + arr[i].bucketUL.year)
                                            else if (arr[i].size == 2) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year)
                                            else if (arr[i].size == 3) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month)
                                            else if (arr[i].size == 4) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                            else if (arr[i].size == 5) parameters.set("r." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL.year + "-" + arr[i].bucketLL.month + "-" + arr[i].bucketLL.day)
                                            arr[i]['href'] = window.location.pathname + "?" + parameters
                                        }
                                        vm.items = arr
                                        vm.itemsType = 'Time'
                                        vm.displayCount = 0
                                    }
                                    else {
                                        vm.itemsType = 'TimeFail'
                                    }

                                })
                                .catch(_error => {
                                    vm.itemsType = 'Error'
                                })
                        })
                }
                else if (propertyType == "Quantity") {
                    // Quantity property type
                    // Set the URL parameters for href attribute, i.e., only for display purpose. 
                    var q = window.location.search;
                    parameters = new URLSearchParams(q)
                    parameters.delete("cf")
                    parameters.delete("sf")
                    parameters.set("q." + vm.currentFilter.value + "." + vm.secondaryFilter.value, "novalue")
                    vm.noValueURL = window.location.pathname + "?" + parameters
                    /* 
                     Gets items and their normalized amount/quantity.
                     Query for quantities with units. 
                    */
                    sparqlQuery = "SELECT ?item ?amount WHERE {\n" +
                        vm.classSelector +
                        filterString +
                        "{#Current filter\n?item wdt:"+vm.currentFilter.value+" ?temp.\n" +
                        "?temp (p:" + vm.secondaryFilter.value + "/psn:" + vm.secondaryFilter.value + ") ?v.\n" +
                        "?v wikibase:quantityAmount ?amount.\n}" +
                        filterRanges +
                        filterQuantities +
                        noValueString +
                        "}\n" +
                        "ORDER BY ?amount";
                    vm.query = queryServiceWebsiteURL + encodeURIComponent(sparqlQuery);
                    var fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => (response.data['results']['bindings'].length ? response : ''))
                        .then((response) => {
                                if (response == "") {
                                    // If the above query returns null then try for un-normalized values.
                                    sparqlQuery = "SELECT ?amount WHERE {\n" +
                                    vm.classSelector +
                                    filterString +
                                    "{ # Current filter\n?item wdt:" + vm.currentFilter.value + " ?temp.\n" +
                                    (centralSPARQLService ? '' : "SERVICE <" + centralSPARQLService + "> {\n") +
                                    "?temp (p:" + vm.secondaryFilter.value + "/psv:" + vm.secondaryFilter.value + ") ?v.\n" +
                                    "?v wikibase:quantityAmount ?amount.\n" +
                                    (centralSPARQLService ? '' : "}\n") +
                                    "}\n" +
                                    filterRanges +
                                    filterQuantities +
                                    noValueString +
                                    "\n}\n" +
                                    "ORDER BY ?amount"
                                    vm.query = queryServiceWebsiteURL + encodeURIComponent(sparqlQuery)
                                    fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery)
                                    axios.get(fullUrl)
                                        .then(res => {
                                            if (res.data['results']['bindings'].length) {
                                                arr = generateFilterValuesFromNumbers(res.data['results']['bindings'])
                                                // Set the href parameter of each bucket.
                                                for (var i = 0; i < arr.length; i++) {
                                                    var q = window.location.search
                                                    parameters = new URLSearchParams(q)
                                                    parameters.delete("cf")
                                                    parameters.delete("sf")
                                                    parameters.set("q." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                                }
                                                vm.items = arr
                                                vm.itemsType = 'Quantity'
                                                vm.displayCount = 1;
                                                cachedFilterValues[queryString] = {items: vm.items, itemsType: "Quantity"};
                                            }
                                            else {
                                                // Check if "No value" is to be displayed or not.
                                                index = vm.appliedQuantities.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                                if (index != -1) vm.itemsType = "Additionalempty"
                                                else vm.itemsType = 'Quantity'
                                            }
                                        })
                                        .catch(_error => {
                                            /*
                                             Gets fallback results in case the primary query fails or times out.
                                             Finds random quantity amounts and creates buckets.
                                            */
                                            sparqlQuery = "SELECT ?amount WHERE\n" +
                                                "{\n" +
                                                "  SELECT ?amount WHERE {\n" +
                                                "    hint:Query hint:optimizer \"None\".\n" +
                                                "    " + vm.classSelector +
                                                "    ?item wdt:" + vm.currentFilter.value + " ?temp.\n" +
                                                "    ?temp (p:" + vm.secondaryFilter.value + "/psv:" + vm.secondaryFilter.value + ") ?v.\n" +
                                                "    ?v wikibase:quantityAmount ?amount.\n" +
                                                "}\n" +
                                                "LIMIT " + resultsPerPage + "\n" +
                                                "}\n" +
                                                "ORDER BY ?amount"
                                            fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery)
                                            axios.get(fullUrl)
                                                .then(r => {
                                                    if (r.data['results']['bindings'].length) {
                                                        arr = generateFilterValuesFromNumbers(r.data['results']['bindings'])
                                                        // Set the href parameter of each bucket.
                                                        for (var i = 0; i < arr.length; i++) {
                                                            var q = window.location.search
                                                            parameters = new URLSearchParams(q)
                                                            parameters.delete("cf")
                                                            parameters.delete("sf")
                                                            parameters.set("q." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                                            arr[i]['href'] = window.location.pathname + "?" + parameters
                                                        }
                                                        vm.items = arr;
                                                        vm.itemsType = 'Quantity';
                                                        vm.displayCount = 0;
                                                    } else {
                                                        vm.itemsType = 'QuantityFail';
                                                    }

                                                })
                                                .catch(_error => {
                                                    vm.itemsType = 'Error'
                                                })
                                        })
                                }
                                else {
                                    firstItem = response.data['results']['bindings'][0].item.value.split("/").slice(-1)[0]
                                    var unitQuery = "SELECT ?unitLabel WHERE {\n" +
                                        "    wd:" + firstItem + " wdt:" + vm.currentFilter.value + " ?temp.\n" +
                                        "    ?temp (p:" + vm.secondaryFilter.value + "/psn:" + vm.secondaryFilter.value + ") ?v.\n" +
                                        "    ?v wikibase:quantityAmount ?amount;\n" +
                                        "       wikibase:quantityUnit ?unit.\n" +
                                        "  SERVICE wikibase:label { bd:serviceParam wikibase:language \""+ lang +",[AUTO_LANGUAGE],en\". }\n" +
                                        "}"
                                    const url = sparqlEndpoint + encodeURIComponent(unitQuery)
                                    axios.get(url)
                                        .then(res => {
                                            if (response.data['results']['bindings'].length) {
                                                arr = generateFilterValuesFromNumbers(response.data['results']['bindings'], res.data['results']['bindings'][0].unitLabel.value)
                                                for (var i = 0; i < arr.length; i++) {
                                                    var q = window.location.search
                                                    parameters = new URLSearchParams(q)
                                                    parameters.delete("cf")
                                                    parameters.delete("sf")
                                                    parameters.set("q." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                                }
                                                vm.items = arr
                                                vm.itemsType = 'Quantity'
                                            }
                                            else {
                                                index = vm.appliedFilters.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                                if (index == -1)
                                                    vm.itemsType = "Additionalempty"
                                                else
                                                    vm.itemsType = 'Quantity'
                                            }
                                        })
                                        .catch(_error => {
                                            vm.itemsType = 'Error'
                                        })

                                }
                            }
                        )
                        .catch(_error => {
                            sparqlQuery = "SELECT ?amount WHERE\n" +
                                "{\n" +
                                "  SELECT ?item ?amount WHERE {\n" +
                                "  hint:Query hint:optimizer \"None\".\n" +
                                "    " + vm.classSelector +
                                "    ?item (p:" + vm.secondaryFilter.value + "/psn:" + vm.secondaryFilter.value + ") ?v.\n" +
                                "    ?v wikibase:quantityAmount ?amount.\n" +
                                "}\n" +
                                "LIMIT " + resultsPerPage + "\n" +
                                "}\n" +
                                "ORDER BY ?amount";
                            vm.query = queryServiceWebsiteURL + encodeURIComponent(sparqlQuery);
                            const url = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                            axios.get(url)
                                .then(res => {
                                    if (vm.itemsType = 'Quantity') {
                                        arr = generateFilterValuesFromNumbers(res.data['results']['bindings'])
                                        for (var i = 0; i < arr.length; i++) {
                                            var q = window.location.search;
                                            parameters = new URLSearchParams(q)
                                            parameters.delete("cf")
                                            parameters.delete("sf")
                                            parameters.set("q." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].bucketLL + "~" + arr[i].bucketUL + (arr[i].unit != "" ? ("~" + arr[i].unit) : ""))
                                            arr[i]['href'] = window.location.pathname + "?" + parameters
                                        }
                                        vm.items = arr
                                        vm.displayCount = 0
                                    }
                                })
                                .catch(_error => {
                                    vm.itemsType = 'Error'
                                })
                        })
                }
                else {
                    // Property type is hopefully "Item", AKA "WikibaseItem" ("String" is not
                    // handled yet for secondary filters).
                    vm.itemsType = "ItemLoading";
                    // Set the URL parameters for href attribute, i.e., only for display purpose. 
                    var q = window.location.search;
                    parameters = new URLSearchParams(q)
                    parameters.set("f." + vm.currentFilter.value + "." + vm.secondaryFilter.value, "novalue")
                    vm.noValueURL = window.location.pathname + "?" + parameters
                    parentFilterString += "?temp wdt:" + vm.secondaryFilter.value + " ?value.\n";
                    // Gets items and their count.
                    if (centralSPARQLService) {
                        labelClause = "SERVICE <" + centralSPARQLService + "> {\n" +
                            "  SERVICE wikibase:label {\n" +
                            "    bd:serviceParam wikibase:language \"" + lang + "\".\n" +
                            "    ?value rdfs:label ?valueLabel\n" +
                            "  }\n" +
                            "}\n";
                        parentFilterString = "SERVICE <" + centralSPARQLService + "> {\n" +
                            parentFilterString +
                            "\n}\n";
                    } else {
                        labelClause = "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n";
                    }

                    var sparqlQuery = "SELECT ?value ?valueLabel ?count\n";

                    if (centralSPARQLService) {
                        sparqlQuery += "WITH {\n" +
                            "SELECT ?temp (count(?temp) as ?tempCount) WHERE {\n";
                    } else {
                        sparqlQuery += "WHERE {\n" +
                            "{\n" +
                            "SELECT ?value (COUNT(?value) AS ?count) WHERE {\n";
                    }

                    sparqlQuery += vm.classSelector +
                        "?item wdt:" + vm.currentFilter.value + " ?temp .\n" +
                        filterString +
                        filterRanges +
                        filterQuantities +
                        noValueString;

                    if (centralSPARQLService) {
                        sparqlQuery += "\n} GROUP BY ?temp\n" +
                            "} AS %local\n" +
                            "WHERE {\n" +
                            "{\n" +
                            "SELECT ?value (sum(?tempCount) as ?count) WHERE {\n" +
                            "INCLUDE %local\n";
                    }

                    sparqlQuery += parentFilterString +
                        "}\n" +
                        "GROUP BY ?value\n" +
                        "ORDER BY DESC (?count)\n" +
                        "LIMIT 1000\n" +
                        "}\n" +
                        labelClause +
                        "}\n" +
                        "ORDER BY DESC (?count)";
                    vm.query = queryServiceWebsiteURL + encodeURIComponent(sparqlQuery);
                    var fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                    axios.get(fullUrl)
                        .then(response => {
                            if (response.data['results']['bindings'].length) {
                                arr = [...response.data['results']['bindings']]
                                // Remove the already applied filter value.
                                index = []
                                for (let i = 0; i < vm.appliedFilters.length; i++) {
                                    if (vm.appliedFilters[i].filterValue == vm.secondaryFilter.value) {
                                        index.push(vm.appliedFilters[i].value)
                                    }
                                }
                                arr = arr.filter(x => (!x.valueLabel.value.includes(".well-known") &&
                                        !index.includes(x.value.value.split('/').slice(-1)[0])))
                                if (arr.length > 0) {
                                    vm.itemsType = "Item";
                                    vm.items = arr;
                                    vm.displayCount = 1;
                                    cachedFilterValues[queryString] = {items: vm.items, itemsType: "Item"};
                                }
                                else {
                                    vm.itemsType = "Additionalempty"
                                }
                                // Set the href parameter of each value.
                                for (var i = 0; i < arr.length; i++) {
                                    var q = window.location.search;
                                    parameters = new URLSearchParams(q)
                                    parameters.delete("cf")
                                    parameters.delete("sf")
                                    var existingValues = ""
                                    // Multiple values for a filter
                                    for (let i = 0; i < vm.appliedFilters.length; i++) {
                                        if (vm.appliedFilters[i].filterValue == vm.secondaryFilter.value) {
                                            existingValues = existingValues + vm.appliedFilters[i].value + "-";
                                        }
                                    }
                                    parameters.set("f." + vm.currentFilter.value + "." + vm.secondaryFilter.value, existingValues + arr[i].value.value.split('/').slice(-1)[0])
                                    arr[i]['href'] = window.location.pathname + "?" + parameters
                                }
                            }
                            else {
                                // Check if "No value" is to be displayed or not.
                                index = vm.appliedFilters.findIndex(filter => filter.filterValue == vm.secondaryFilter.value)
                                if (index == -1) vm.itemsType = "Additionalempty"
                                else vm.itemsType = 'Item'
                            }
                        })
                        .catch(_error => {
                            /*
                                Gets fallback results in case the primary query fails or times out.
                                Finds random 300 values.
                            */
                            if (veryLargeClasses.includes(this.classValue) && this.appliedFilters.length == 0 && this.appliedRanges.length == 0 && this.appliedQuantities.length == 0) {
                                offset = Math.floor(Math.random() * (fallbackQueryLimit * 30));
                            } else {
                                offset = 0;
                            }

                            if (centralSPARQLService) {
                                labelClause = "SERVICE <" + centralSPARQLService + "> {\n" +
                                   "  SERVICE wikibase:label {\n" +
                                   "    bd:serviceParam wikibase:language \"" + lang + "\".\n" +
                                   "    ?value rdfs:label ?valueLabel\n" +
                                   "  }\n";
                                  parentFilterString = "SERVICE <" + centralSPARQLService + "> {\n" +
                                      parentFilterString +
                                      "\n}\n";
                            } else {
                                labelClause = "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n";
                            }

                            sparqlQuery = "SELECT ?value ?valueLabel WHERE {\n" +
                                "  {\n" +
                                "    SELECT DISTINCT ?value WHERE {\n" +
                                "      SELECT ?value WHERE {\n" +
                                "        hint:Query hint:optimizer \"None\".\n" +
                                "        " + vm.classSelector +
                                "        ?item wdt:" + vm.currentFilter.value + " ?temp.\n" +
                                "        ?temp wdt:" + vm.secondaryFilter.value + " ?value.\n" +
                                filterString +
                                filterRanges +
                                filterQuantities +
                                parentFilterString +
                                "      }\n" +
                                "      OFFSET " + offset + "\n" +
                                "      LIMIT " + fallbackQueryLimit + "\n" +
                                "    }\n" +
                                "  }\n" +
                                labelClause +
                                " }\n" +
                                "}\n" +
                                "ORDER BY (?valueLabel)";
                            fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
                            axios.get(fullUrl)
                                .then((res) => {
                                    // Sorting the results
                                    arr = [...res.data['results']['bindings']].slice(0).sort(
                                        function (a, b) {
                                            var x = a.valueLabel.value.toLowerCase();
                                            var y = b.valueLabel.value.toLowerCase();
                                            return x < y ? -1 : x > y ? 1 : 0;
                                        })
                                    // Set the href parameter of each value.
                                    for (var i = 0; i < arr.length; i++) {
                                        var q = window.location.search;
                                        parameters = new URLSearchParams(q)
                                        parameters.delete("cf")
                                        parameters.delete("sf")
                                        parameters.set("f." + vm.currentFilter.value + "." + vm.secondaryFilter.value, arr[i].value.value.split('/').slice(-1)[0])
                                        arr[i]['href'] = window.location.pathname + "?" + parameters
                                    }
                                    vm.items = arr
                                    vm.itemsType = "ItemFail"
                                    vm.displayCount = 0
                                })
                                .catch(_error => {
                                    vm.itemsType = 'Error'
                                })

                        })
                }
                // Download csv directly
                if (this.format == 'csv') {
                    this.exportCSV();
                }
            })
    }
})
