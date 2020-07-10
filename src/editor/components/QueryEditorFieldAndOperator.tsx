import React, { useState, useMemo, useCallback } from 'react';
import { css } from 'emotion';
import { stylesFactory, Button } from '@grafana/ui';
import { QueryEditorExpression, QueryEditorExpressionType, QueryEditorOperatorExpression } from './types';
import { QueryEditorOperatorDefinition, QueryEditorFieldDefinition } from '../types';
import { QueryEditorField, QueryEditorFieldExpression, isField } from './QueryEditorField';
import { QueryEditorOperator, isOperator } from './QueryEditorOperator';

interface Props {
  value?: QueryEditorFieldAndOperatorExpression;
  fields: QueryEditorFieldDefinition[];
  operators: QueryEditorOperatorDefinition[];
  onChange: (expression: QueryEditorFieldAndOperatorExpression | undefined) => void;
}

export interface QueryEditorFieldAndOperatorExpression extends QueryEditorExpression {
  field: QueryEditorFieldExpression;
  operator: QueryEditorOperatorExpression;
}

export const QueryEditorFieldAndOperator: React.FC<Props> = props => {
  const [showEditor, setShowEditor] = useState(false);
  const [field, setField] = useState(defaultField(props));
  const [operator, setOperator] = useState(props.value?.operator);
  const operatorsByType = useOperatorByType(props.operators);
  const operators = operatorsByType[field?.fieldType.toString() ?? ''] ?? [];
  const styles = getStyles();

  const onChange = useCallback(
    (expression: QueryEditorFieldExpression | QueryEditorOperatorExpression) => {
      if (isField(expression)) {
        setField(expression);

        if (operator) {
          props.onChange({
            type: QueryEditorExpressionType.FieldAndOperator,
            field: expression,
            operator,
          });
        }
      }

      if (isOperator(expression)) {
        setOperator(expression);

        if (field) {
          props.onChange({
            type: QueryEditorExpressionType.FieldAndOperator,
            field: field,
            operator: expression,
          });
        }
      }
    },
    [setField, setOperator, props.onChange]
  );

  const onShowEditor = useCallback(() => {
    setShowEditor(true);
  }, [setShowEditor]);

  const onClearEditor = useCallback(() => {
    setShowEditor(false);
    props.onChange(undefined);
  }, [setShowEditor]);

  if (!props.value && !showEditor) {
    return (
      <div className={styles.container}>
        <Button variant="secondary" onClick={onShowEditor} icon="plus" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <QueryEditorField value={props.value?.field} fields={props.fields} onChange={onChange} />
      <QueryEditorOperator value={props.value?.operator} operators={operators} onChange={onChange} />
      <Button variant="secondary" onClick={onClearEditor} className={styles.clearButton} icon="minus" />
    </div>
  );
};

export const isFieldAndOperator = (
  expression: QueryEditorExpression
): expression is QueryEditorFieldAndOperatorExpression => {
  return (expression as QueryEditorFieldAndOperatorExpression)?.type === QueryEditorExpressionType.FieldAndOperator;
};

const useOperatorByType = (
  operators: QueryEditorOperatorDefinition[]
): Record<string, QueryEditorOperatorDefinition[]> => {
  return useMemo(() => {
    const groups = {};

    for (const operator of operators) {
      for (const type of operator.supportTypes) {
        const key = type.toString();

        if (!Array.isArray(groups[key])) {
          groups[key] = [];
        }
        groups[key].push(operator);
      }
    }

    return groups;
  }, [operators]);
};

const defaultField = (props: Props): QueryEditorFieldExpression | undefined => {
  if (props.value?.field) {
    return props.value?.field;
  }

  return {
    type: QueryEditorExpressionType.Field,
    value: props.fields[0]?.value,
    fieldType: props.fields[0]?.type,
  };
};

const getStyles = stylesFactory(() => {
  return {
    container: css`
      display: flex;
      flex-direction: row;
    `,
    clearButton: css`
      margin-left: 4px;
    `,
  };
});
