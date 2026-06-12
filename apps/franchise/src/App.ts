import { ElAlert, ElButton, ElCard, ElInput, ElSpace, ElTag } from 'element-plus';
import { defineComponent, h, ref } from 'vue';
import { AuthenticatedUser, IssueWelfareCardResponse, issueWelfareCard, loginFranchise } from './api';

type LoginForm = {
  username: string;
  password: string;
};

type IssueForm = {
  buyerUserId: string;
  amount: string;
  remark: string;
};

const storedTokenKey = 'franchiseAccessToken';

export default defineComponent({
  name: 'FranchiseApp',
  setup() {
    const loginForm = ref<LoginForm>({ username: 'franchise-local', password: 'local-dev-password' });
    const issueForm = ref<IssueForm>({ buyerUserId: 'buyer-local', amount: '20000', remark: '本地加盟商福利卡发行' });
    const accessToken = ref(localStorage.getItem(storedTokenKey) ?? '');
    const authUser = ref<AuthenticatedUser | null>(null);
    const issueResult = ref<IssueWelfareCardResponse | null>(null);
    const message = ref<string | null>(null);
    const error = ref<string | null>(null);
    const loading = ref(false);

    function updateLoginField(field: keyof LoginForm, value: string) {
      loginForm.value = { ...loginForm.value, [field]: value };
    }

    function updateIssueField(field: keyof IssueForm, value: string) {
      issueForm.value = { ...issueForm.value, [field]: value };
    }

    async function submitLogin() {
      loading.value = true;
      error.value = null;
      try {
        const result = await loginFranchise(loginForm.value);
        accessToken.value = result.accessToken;
        authUser.value = result.user;
        localStorage.setItem(storedTokenKey, result.accessToken);
        message.value = `${result.user.displayName} 已登录`;
      } catch (loginError) {
        localStorage.removeItem(storedTokenKey);
        accessToken.value = '';
        authUser.value = null;
        error.value = loginError instanceof Error ? loginError.message : '加盟商登录失败';
      } finally {
        loading.value = false;
      }
    }

    async function submitIssue() {
      const user = authUser.value;
      const buyerUserId = issueForm.value.buyerUserId.trim();
      const amount = Number(issueForm.value.amount);
      if (!user || user.subjectType !== 'franchise' || !accessToken.value) {
        message.value = null;
        error.value = '请先使用加盟商账号登录';
        return;
      }
      if (!buyerUserId || !Number.isInteger(amount) || amount <= 0) {
        message.value = null;
        error.value = '请填写发卡用户ID和正整数发卡金额';
        return;
      }

      loading.value = true;
      error.value = null;
      try {
        const result = await issueWelfareCard({
          token: accessToken.value,
          franchiseId: user.subjectId,
          requestId: `FRANCHISE-WELFARE-ISSUE-${buyerUserId}-${amount}`,
          buyerUserId,
          amount,
          remark: issueForm.value.remark
        });
        issueResult.value = result;
        message.value = `${buyerUserId} 福利卡已发放 ${formatMoney(result.ledgerEntry.amount)}`;
      } catch (issueError) {
        error.value = issueError instanceof Error ? issueError.message : '福利卡发放失败';
      } finally {
        loading.value = false;
      }
    }

    return () =>
      h('main', { class: 'app-shell' }, [
        h('section', { class: 'hero-band' }, [
          h('div', [
            h('p', { class: 'eyebrow' }, 'Franchise Console'),
            h('h1', authUser.value ? '加盟商工作台' : '加盟商登录'),
            h(
              'p',
              { class: 'muted' },
              authUser.value
                ? `当前加盟商 ${authUser.value.subjectId} / ${authUser.value.displayName}`
                : '加盟商是福利卡发行方、销售账主体和收款归属主体'
            )
          ])
        ]),
        message.value ? h(ElAlert, { title: message.value, type: 'success', showIcon: true, closable: false }) : null,
        error.value ? h(ElAlert, { title: error.value, type: 'error', showIcon: true, closable: false }) : null,
        authUser.value ? renderIssuePanel(issueForm.value, issueResult.value, { submitIssue, updateIssueField }, loading.value) : renderLoginPanel(loginForm.value, { submitLogin, updateLoginField }, loading.value)
      ]);
  }
});

function renderLoginPanel(
  form: LoginForm,
  actions: {
    submitLogin: () => Promise<void>;
    updateLoginField: (field: keyof LoginForm, value: string) => void;
  },
  loading: boolean
) {
  return h(ElCard, { class: 'workspace-panel' }, () => [
    h('h2', '加盟商登录'),
    h('div', { class: 'form-grid' }, [
      textInput('用户名', form.username, (value) => actions.updateLoginField('username', value)),
      textInput('密码', form.password, (value) => actions.updateLoginField('password', value), 'password')
    ]),
    h(ElButton, { type: 'primary', loading, onClick: actions.submitLogin }, () => '登录加盟商工作台')
  ]);
}

function renderIssuePanel(
  form: IssueForm,
  result: IssueWelfareCardResponse | null,
  actions: {
    submitIssue: () => Promise<void>;
    updateIssueField: (field: keyof IssueForm, value: string) => void;
  },
  loading: boolean
) {
  return h(ElCard, { class: 'workspace-panel' }, () => [
    h('div', { class: 'panel-heading' }, [
      h('div', [h('h2', '福利卡发放'), h('p', { class: 'muted' }, '发卡加盟商来自当前登录主体')]),
      h(ElTag, { type: 'success' }, () => '加盟商发卡')
    ]),
    h('div', { class: 'form-grid' }, [
      textInput('发卡用户ID', form.buyerUserId, (value) => actions.updateIssueField('buyerUserId', value)),
      textInput('发卡金额(分)', form.amount, (value) => actions.updateIssueField('amount', value)),
      textInput('发卡备注', form.remark, (value) => actions.updateIssueField('remark', value))
    ]),
    h(ElButton, { type: 'success', loading, onClick: actions.submitIssue }, () => '发放福利卡'),
    result
      ? h('article', { class: 'result-panel' }, [
          h('strong', result.account.accountNo),
          h('p', `${result.account.buyerUserId} / ${result.account.franchiseId}`),
          h(ElSpace, { wrap: true }, () => [
            h(ElTag, { type: 'success' }, () => `发卡流水 ${result.ledgerEntry.ledgerNo}`),
            h(ElTag, () => `账户余额 ${formatMoney(result.account.balanceAmount)}`),
            h(ElTag, () => `累计发行 ${formatMoney(result.account.issuedAmount)}`)
          ])
        ])
      : h('p', { class: 'empty-state' }, '暂无本次发卡结果')
  ]);
}

function textInput(labelText: string, value: string, onValue: (value: string) => void, type = 'text') {
  return h('label', { class: 'field' }, [
    h('span', labelText),
    h(ElInput, {
      modelValue: value,
      type,
      'onUpdate:modelValue': onValue
    })
  ]);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount / 100);
}
