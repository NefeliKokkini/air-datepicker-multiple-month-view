import consts from './consts';
import {
    getEl,
    createElement,
    getDaysCount,
    getParsedDate,
    subDays,
    getDecade,
    isSameDate,
    addEventListener,
    closest,
    isDateBigger,
    isDateSmaller,
    classNames,
} from './utils';
import DatepickerCell from './datepickerCell';

import './datepickerBody.scss';

let templates = {
    [consts.days]:'' +
        '<div class="air-datepicker-body--day-names"></div>' +
        `<div class="air-datepicker-body--cells -${consts.days}-"></div>`,
    [consts.months]: `<div class="air-datepicker-body--cells -${consts.months}-"></div>`,
    [consts.years]: `<div class="air-datepicker-body--cells -${consts.years}-"></div>`
};

const cellClassName = '.air-datepicker-cell';

export default class DatepickerBody {
    constructor({dp, type, opts}) {
        this.dp = dp;
        this.type = type;
        this.opts = opts;
        this.cells = [[],[]]; // two dimensional array
        this.$el = [];
        this.$names = []; // array to support multi-months view
        this.$cells = []; // array to support multi-months view
        this.pressed = false;
        this.isVisible = true;

        this.init();
    }

    init() {
        this._buildBaseHtml();
        if (this.type === consts.days) {
            this.renderDayNames();
        }
        this.render();
        this._bindEvents();
        this._bindDatepickerEvents();
    }

    _bindEvents() {
        let {range, dynamicRange} = this.opts;

        this.$el.forEach( el => {
            el.addEventListener('mouseover', this.onMouseOverCell);
            el.addEventListener('mouseout', this.onMouseOutCell);
            el.addEventListener('click', this.onClickBody);
        });
        
        // addEventListener(this.$el, 'mouseover', this.onMouseOverCell);
        // addEventListener(this.$el, 'mouseout', this.onMouseOutCell);
        // addEventListener(this.$el, 'click', this.onClickBody);

        if (range && dynamicRange) {
            
            this.$el.forEach( el => {
                el.addEventListener('mousedown', this.onMouseDown);
                el.addEventListener('mousemove', this.onMouseMove);
            });

            // addEventListener(this.$el, 'mousedown', this.onMouseDown);
            // addEventListener(this.$el, 'mousemove', this.onMouseMove);
            addEventListener(window.document, 'mouseup', this.onMouseUp);
        }

    }

    _bindDatepickerEvents() {
        this.dp.on(consts.eventChangeViewDate, this.onChangeViewDate);
        this.dp.on(consts.eventChangeCurrentView, this.onChangeCurrentView);
    }

    _buildBaseHtml() {
        for ( let i = 0; i < this.dp.showMonths; i++ ) {
            this.$el.push(createElement({
                className: `air-datepicker-body -${this.type}-`,
                innerHtml: templates[this.type]
            }));

            this.$names[i] = getEl('.air-datepicker-body--day-names', this.$el[i], i);
            this.$cells[i] = getEl('.air-datepicker-body--cells', this.$el[i]);

        }        
    }

    _getDayNamesHtml(firstDay = this.dp.locale.firstDay) {
        let html = '',
            isWeekend = this.dp.isWeekend,
            {onClickDayName} = this.opts,
            curDay = firstDay,
            totalDays = 7,
            i = 0;

        while (i < totalDays) {
            let day = curDay % totalDays;
            let className = classNames('air-datepicker-body--day-name', {
                [consts.cssClassWeekend]: isWeekend(day),
                '-clickable-': !!onClickDayName
            });
            let dayName = this.dp.locale.daysMin[day];

            html += `<div class="${className}" data-day-index='${day}'>${dayName}</div>`;

            i++;
            curDay++;
        }
        return html;
    }

    _getDaysCells(j) {
        let {viewDate, locale: {firstDay}} = this.dp,
            totalMonthDays = getDaysCount(viewDate),
            {year, month} = getParsedDate(viewDate),
            firstMonthDay = new Date(year, month, 1),
            lastMonthDay = new Date(year, month, totalMonthDays),
            daysFromPrevMonth = firstMonthDay.getDay() - firstDay,
            daysFromNextMonth = 6 - lastMonthDay.getDay() + firstDay;

        daysFromPrevMonth = daysFromPrevMonth < 0 ? daysFromPrevMonth + 7 : daysFromPrevMonth;
        daysFromNextMonth = daysFromNextMonth > 6 ? daysFromNextMonth - 7 : daysFromNextMonth;

        let firstRenderDate = subDays(firstMonthDay, daysFromPrevMonth),
            totalRenderDays = totalMonthDays + daysFromPrevMonth + daysFromNextMonth,
            firstRenderDayDate = firstRenderDate.getDate(),
            {year:renderYear, month: renderMonth} = getParsedDate(firstRenderDate),
            i = 0;

        while (i < totalRenderDays) {
            let date = new Date(renderYear, renderMonth, firstRenderDayDate + i);
            this._generateCell(date, j);
            i++;
        }
    }

    _generateCell(date, j) {
        let {type, dp, opts} = this;
        let cell = new DatepickerCell({
            type,
            dp,
            opts,
            date,
            body: this
        });

        this.cells[j].push(cell);

        return cell;
    }

    _generateDayCells(i) {
        this._getDaysCells(i);
    }

    _generateMonthCells() {
        let totalMonths = 12,
            {year} = this.dp.parsedViewDate,
            currentMonth = 0;

        while (currentMonth < totalMonths) {
            this.cells.push(this._generateCell(new Date(year, currentMonth)));
            currentMonth++;
        }
    }

    _generateYearCells() {
        let decade = getDecade(this.dp.viewDate),
            firstYear = decade[0] - 1,
            lastYear = decade[1] + 1,
            year = firstYear;

        while (year <= lastYear) {
            this.cells.push(this._generateCell(new Date(year, 0)));
            year++;
        }
    }

    renderDayNames() {
        for ( let i = 0; i < this.dp.showMonths; i++ ) {
            this.$names[i].innerHTML =  this._getDayNamesHtml();
        }  

    }

    _generateCells(i) {
        switch (this.type) {
            case consts.days:
                this._generateDayCells(i);
                break;
            case consts.months:
                this._generateMonthCells();
                break;
            case consts.years:
                this._generateYearCells();
                break;
        }
    }

    show() {
        this.isVisible = true;
        this.$el.classList.remove('-hidden-');
    }

    hide() {
        this.isVisible = false;
        this.$el.classList.add('-hidden-');
    }

    destroyCells() {

        for ( let i = 0; i < this.dp.showMonths; i++ ) {
            this.cells[i].forEach(c => c.destroy());
            this.$cells[i].innerHTML = '';
        }  

    }

    destroy() {
        this.destroyCells();
        this.dp.off(consts.eventChangeViewDate, this.onChangeViewDate);
        this.dp.off(consts.eventChangeCurrentView, this.onChangeCurrentView);
    }

    handleClick = (e) => {
        let $cell = e.target.closest(cellClassName);
        let cell = $cell.adpCell;
        if (cell.isDisabled) return;

        if (!this.dp.isMinViewReached) {
            this.dp.down();
            return;
        }

        let alreadySelectedDate = this.dp._checkIfDateIsSelected(cell.date, cell.type);

        if (alreadySelectedDate) {
            this.dp._handleAlreadySelectedDates(alreadySelectedDate, cell.date);
        } else {
            this.dp.selectDate(cell.date);
        }
    }

    handleDayNameClick = (e) => {
        let index = e.target.getAttribute('data-day-index');

        this.opts.onClickDayName({
            dayIndex: Number(index),
            datepicker: this.dp
        });
    }

    onChangeCurrentView = (view) => {
        if (view !== this.type) {
            this.hide();
        } else {
            this.show();
            this.render();
        }
    }

    onMouseOverCell = (e) => {
        let $cell = closest(e.target, cellClassName);
        this.dp.setFocusDate($cell ? $cell.adpCell.date : false);
    }

    onMouseOutCell = () => {
        this.dp.setFocusDate(false);
    }

    onClickBody = (e) => {
        let {onClickDayName} = this.opts;
        let target = e.target;

        if (target.closest(cellClassName)) {
            this.handleClick(e);
        }

        if (onClickDayName && target.closest('.air-datepicker-body--day-name')) {
            this.handleDayNameClick(e);
        }
    }

    onMouseDown = (e) => {
        this.pressed = true;

        let $cell = closest(e.target, cellClassName),
            cell = $cell && $cell.adpCell;

        if (isSameDate(cell.date, this.dp.rangeDateFrom)) {
            this.rangeFromFocused = true;
        }
        if (isSameDate(cell.date, this.dp.rangeDateTo)) {
            this.rangeToFocused = true;
        }
    }

    onMouseMove = (e) => {
        if (!this.pressed || !this.dp.isMinViewReached) return;
        e.preventDefault();

        let $cell = closest(e.target, cellClassName),
            cell = $cell && $cell.adpCell,
            {selectedDates, rangeDateTo, rangeDateFrom} = this.dp;

        if (!cell || cell.isDisabled) return;

        let {date} = cell;

        // Allow user to change selected range
        if (selectedDates.length === 2) {
            // Add hours and minute to new selected date, to update time sliders properly
            if (this.rangeFromFocused && !isDateBigger(date, rangeDateTo)) {
                let {hours, minutes} = getParsedDate(rangeDateFrom);
                date.setHours(hours);
                date.setMinutes(minutes);

                this.dp.rangeDateFrom = date;
                this.dp.replaceDate(rangeDateFrom, date);
            }
            if (this.rangeToFocused && !isDateSmaller(date, rangeDateFrom)) {
                let {hours, minutes} = getParsedDate(rangeDateTo);
                date.setHours(hours);
                date.setMinutes(minutes);

                this.dp.rangeDateTo = date;
                this.dp.replaceDate(rangeDateTo, date);
            }
        }
    }

    onMouseUp = () => {
        this.pressed = false;
        this.rangeFromFocused = false;
        this.rangeToFocused = false;
    }

    onChangeViewDate = (date, oldViewDate) => {
        // Handle only visible views
        if (!this.isVisible) return;

        let decade1 = getDecade(date),
            decade2 = getDecade(oldViewDate);

        // Prevent unnecessary cell rendering when going up or down to next view
        switch (this.dp.currentView) {
            case (consts.days):
                if (isSameDate(date, oldViewDate, consts.months)) {
                    return;
                }
                break;
            case (consts.months):
                if (isSameDate(date, oldViewDate, consts.years)) {
                    return;
                }
                break;
            case (consts.years):
                if (decade1[0] === decade2[0] && decade1[1] === decade2[1]) {
                    return;
                }
                break;
        }

        this.render();
    }

    render = () => {
        this.destroyCells();
        
        for ( let i = 0; i < this.dp.showMonths; i++ ) {
            this._generateCells(i);
        }  

        for ( let i = 0; i < this.dp.showMonths; i++ ) {

            this.cells[i].forEach((c) => {
                this.$cells[i].appendChild(c.render());
            });
        } 
       
    }
}
