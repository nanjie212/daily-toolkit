import type { ToolRecord } from '@/types';

export const financeTools: ToolRecord[] = [
{
    id: 'social-insurance-calc',
    name: '五险一金计算器',
    description: '计算五险一金扣除和到手工资',
    category: 'finance',
    icon: 'BanknoteIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'salary', label: '税前工资', type: 'number', placeholder: '税前工资(元)', required: true, defaultValue: 10000, min: 0 },
      { key: 'baseSalary', label: '缴费基数(元)', type: 'number', placeholder: '不填默认按工资', defaultValue: 10000, min: 0 },
    ],
    outputFormat: 'text',
    tips: '缴费基数将按下限3613、上限26541自动夹紧，实际以当地政策为准',
  },

{
    id: 'savings-interest-calc',
    name: '存款利息计算器',
    description: '计算银行存款利息和到期本息',
    category: 'finance',
    icon: 'PercentIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'principal', label: '本金', type: 'number', min: 0, placeholder: '本金(元)', required: true, defaultValue: 10000 },
      { key: 'rate', label: '年利率', type: 'number', min: 0, placeholder: '年利率(%)', required: true, defaultValue: 2 },
      { key: 'years', label: '存款年限', type: 'number', min: 0, placeholder: '存款年限', required: true, defaultValue: 3 },
      {
        key: 'type',
        label: '存款类型',
        type: 'select',
        defaultValue: 'current',
        options: [
          { label: '活期', value: 'current' },
          { label: '定期复利', value: 'fixed' },
        ],
      },
    ],
    outputFormat: 'text',
    tips: '支持活期和定期复利两种计息方式',
  },

{
    id: 'early-repayment-calc',
    name: '提前还款计算器',
    description: '计算提前还贷省下的利息和月供变化',
    category: 'finance',
    icon: 'CreditCardIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'remaining', label: '剩余贷款', type: 'number', min: 0, placeholder: '剩余贷款(元)', required: true, defaultValue: 500000 },
      { key: 'rate', label: '年利率', type: 'number', min: 0, placeholder: '年利率(%)', required: true, defaultValue: 3.5 },
      { key: 'remainYears', label: '剩余年限', type: 'number', min: 0, placeholder: '剩余年限', required: true, defaultValue: 20 },
      { key: 'prepay', label: '提前还款金额', type: 'number', min: 0, placeholder: '提前还款金额(元)', required: true, defaultValue: 100000 },
    ],
    outputFormat: 'text',
    tips: '等额本息简化计算，实际以银行核算为准',
  },

{
    id: 'year-end-bonus-tax-calc',
    name: '年终奖个税计算器',
    description: '计算年终奖单独计税的税额和到手金额',
    category: 'finance',
    icon: 'GiftIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'bonus', label: '年终奖金额', type: 'number', min: 0, placeholder: '年终奖金额(元)', required: true, defaultValue: 50000 },
    ],
    outputFormat: 'text',
    tips: '按全年一次性奖金单独计税方式计算',
  },

{
    id: 'investment-return-calc',
    name: '投资收益计算器',
    description: '计算定期定投的投资收益和到期总值',
    category: 'finance',
    icon: 'TrendingUpIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'principal', label: '初始本金', type: 'number', min: 0, placeholder: '初始本金(元)', required: true, defaultValue: 10000 },
      { key: 'monthly', label: '每月定投', type: 'number', min: 0, placeholder: '每月定投(元)', required: true, defaultValue: 0 },
      { key: 'rate', label: '年化收益率', type: 'number', min: 0, placeholder: '年化收益率(%)', required: true, defaultValue: 4 },
      { key: 'years', label: '投资年限', type: 'number', min: 0, placeholder: '投资年限', required: true, defaultValue: 5 },
    ],
    outputFormat: 'text',
    tips: '理论复利计算，实际收益受市场波动影响',
  },

{
    id: 'car-tax-calc',
    name: '购车费用计算器',
    description: '计算买车落地总价，含购置税和保险',
    category: 'finance',
    icon: 'CarTaxiFrontIcon',
    version: '1.0.0',
    source: 'builtin' as const,
    permissions: [],
    inputSchema: [
      { key: 'price', label: '裸车价', type: 'number', placeholder: '裸车价(元)', required: true, defaultValue: 150000, min: 0 },
      { key: 'displacement', label: '排量', type: 'number', placeholder: '排量(L)', defaultValue: 1.6, min: 0, step: 0.1 },
      { key: 'isNewEnergy', label: '是否新能源车', type: 'checkbox', defaultValue: false },
    ],
    outputFormat: 'text',
    tips: '勾选新能源可免征购置税；保险为估算值',
  }
];
