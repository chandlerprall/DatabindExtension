(function(){
    var bindings = [],
        Binding = function( elementId, context, contextParameter, renderTemplate )
        {
            this.elementId = elementId;
            this.context = context;
            this.contextIdentifier = contextParameter == null ? [] : contextParameter.split( '.' );
            this.renderTemplate = renderTemplate;

            this._hash = this.serializeContext();

            bindings.push( this );
        };
    Binding.prototype = {
        serializeContext: function()
        {
            // Get the parameter
            var identified = this.context,
                parts = this.contextIdentifier;


            for ( var i = 0; i < this.contextIdentifier.length && identified != null; i++ )
            {
                var part = this.contextIdentifier[i];
                identified = identified[part];
            }

            return JSON.stringify( identified );
        },

        isDirty: function()
        {
            var hash = this.serializeContext();
            return hash !== this._hash;
        },

        render: function()
        {
            document.getElementById( this.elementId ).innerHTML = this.renderTemplate();
            this._hash = this.serializeContext();
        }
    };

    var getId = (function(){
        var currentId = 0;
        return function()
        {
            return currentId++;
        }
    })();

    var DatabindExtension = function()
    {
        this.tags = [ 'bind' ];

        this.parse = function( parser, nodes )
        {
            // get the tag token
            var tok = parser.nextToken();

            // parse the args and move after the block end. passing true as the second arg is required if there are no parentheses
            var args = parser.parseSignature( null, true );
            parser.advanceAfterBlockEnd( tok.value );

            // parse the body and possibly the error block, which is optional
            var body = parser.parseUntilBlocks( 'endbind');

            parser.advanceAfterBlockEnd();

            // See above for notes about CallExtension
            return new nodes.CallExtension( this, 'run', args, [body] );
        };

        this.run = function( context, contextParameter, body )
        {
            if ( body == null )
            {
                body = contextParameter;
                contextParameter = null;
            }

            var id = 'boundelement-' + getId();
            ret = new nunjucks.runtime.SafeString( '<div id="' + id + '">' + body() + '</div>' );

            new Binding( id, context.ctx, contextParameter, body );

            return ret;
        };
    };
    DatabindExtension.unbind = function( context )
    {
        for ( var i = 0; i < bindings.length; i++ )
        {
            if ( bindings[i].context === context )
            {
                bindings.splice( i, 1 );
                i--;
            }
        }
    };

    var updateBindings = function()
        {
            for ( var i = 0; i < bindings.length; i++ )
            {
                var binding = bindings[i];

                if ( binding.isDirty() )
                {
                    binding.render();
                }
            }

            scheduleUpdate();
        },
        scheduleUpdate = function()
        {
            if ( window.requestAnimationFrame )
            {
                requestAnimationFrame( updateBindings );
            }
            else
            {
                setTimeout( updateBindings, 1 / 60 );
            }
        };
    scheduleUpdate();

    window.DatabindExtension = DatabindExtension;
})();