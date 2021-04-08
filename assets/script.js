var YformUsability = (function ($) {
    'use strict';

    var searchHandle = null,
        searchValue = '';

    $(document).on('rex:ready', function (event, container) {
        initList(event, container);
        initSelect2();
    });

    function initSelect2() {
        if(jQuery().select2) {
            $('#yform-table_field-rex_event_date-prio select').select2();
        }
    }

    function initList(event, container) {

        function updateStatus($this, status, callback) {
            $('#rex-js-ajax-loader').addClass('rex-visible');

            $.post(rex.ajax_url + '&rex-api-call=yform_usability_api&method=changeStatus', {
                data_id: $this.data('id'),
                table: $this.data('table'),
                status: status
            }, function (resp) {
                callback(resp);
                $('#rex-js-ajax-loader').removeClass('rex-visible');
            });
        }

        // status toggle
        if (container.find('.status-toggle').length) {
            var statusToggle = function () {
                var _this = $(this);

                updateStatus(_this, _this.data('status'), function (resp) {
                    var $parent = _this.parent();
                    $parent.html(resp.message.element);
                    $parent.children('a:first').click(statusToggle);
                });
                return false;
            };
            container.find('.status-toggle').click(statusToggle);
        }
        // status select
        if (container.find('.status-select').length) {
            var statusChange = function () {
                var _this = $(this);

                updateStatus(_this, _this.val(), function (resp) {
                    var $parent = _this.parent();
                    $parent.html(resp.message.element);
                    $parent.children('select:first').change(statusChange);
                });
            };
            container.find('.status-select').change(statusChange);
        }


        if (container.find('.sortable-list').length) {
            var $this = container.find('.sortable-list');

            $this.find('.sort-icon').parent().addClass('sort-handle');

            $this.find('tbody').sortable({
                animation: 150,
                handle: '.sort-handle',
                update: function (e, ui) {
                    var $sort_icon = $(ui.item).find('.sort-icon'),
                        $next = $(ui.item).next(),
                        id = 0,
                        prio_td_index = -1,
                        lowest_prio = -1;

                    // find index of prio th
                    $this.find('thead').find('th').each(function (idx, el) {
                        var $a = $(el).find('a'),
                            href = '';
                        if (!$a.length) {
                            return true; // no link, continue
                        }
                        href = $a.attr('href');
                        if (href.indexOf('func=add') !== -1) {
                            return true; // add link, continue
                        }
                        if (href.indexOf('sort=prio') !== -1) {
                            prio_td_index = idx;
                            return false; // found prio th, store index and break
                        }
                    });
                    // find lowest prio
                    if (prio_td_index > -1) {
                        $this.find('tbody').find('tr').find('td:eq(' + prio_td_index + ')').each(function (idx, el) {
                            var prio = parseInt($(el).text());
                            if (lowest_prio < 0 || prio < lowest_prio) {
                                lowest_prio = prio;
                            }
                        });
                    }
                    // set new prio
                    if (lowest_prio > -1) {
                        $this.find('tbody').find('tr').find('td:eq(' + prio_td_index + ')').each(function (idx, el) {
                            $(el).text(lowest_prio + idx);
                        });
                    }

                    $('#rex-js-ajax-loader').addClass('rex-visible');

                    if ($next.length) {
                        id = $next.find('.sort-icon').data('id');
                    }

                    var url = $sort_icon.data('url') || rex.ajax_url + '&rex-api-call=yform_usability_api&method=updateSort';

                    $.post(url, {
                        data_id: $sort_icon.data('id'),
                        filter: $sort_icon.data('filter'),
                        table: $sort_icon.data('table'),
                        table_type: $sort_icon.data('table-type'),
                        table_sort_order: $sort_icon.data('table-sort-order') || null,
                        table_sort_field: $sort_icon.data('table-sort-field') || null,
                        next_id: id
                    }).done(function (data) {
                        $('#rex-js-ajax-loader').removeClass('rex-visible');
                        if (window.console) {
                            console.log(data);
                        }
                    });
                }
            });
        }
    }

    return {
        doYformSearch: function (_this, event) {
            if (searchHandle) {
                window.clearTimeout(searchHandle);
            }

            if (searchValue == _this.value) {
                return false;
            }
            searchValue = _this.value;
            searchHandle = window.setTimeout(function () {
                var $form = $(_this).parents('form');

                $form.on('submit', function (event) {
                    $.pjax.submit(event, {
                        push: true,
                        fragment: '#rex-js-page-main',
                        container: '#rex-js-page-main'
                    });
                    return false;
                }).submit();
            }, 500);
            return false;
        },

        resetYformSearch: function (_this) {
            $(_this).parents('form').find('[name=yfu-term]').val('').trigger('keyup');
        }
    };
})(jQuery);
